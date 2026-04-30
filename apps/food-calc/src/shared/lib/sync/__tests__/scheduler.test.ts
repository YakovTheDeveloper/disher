import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
    type MockedFunction,
} from 'vitest';

// 8.11 Scheduler debounce + leader lock (P2).
//
// Strategy: ONE module instance across the suite (no vi.resetModules — the
// scheduler holds setInterval handles in module scope and resetModules
// orphans them, causing fake-timer floods). Each test:
//   - stops the scheduler from the previous test (releases listeners + interval)
//   - clears the drainPush mock
//   - starts fresh.

vi.mock('../backupClient', () => ({
    drainPush: vi.fn(async () => ({ accepted: 0, rejected: 0 })),
}));
vi.mock('@/shared/lib/observability/diagLog', () => ({
    diagLog: vi.fn(),
}));

// Real imports — module instance is the same for every test below.
import { drainPush as drainPushReal } from '../backupClient';
import {
    scheduleHot,
    scheduleCold,
    startScheduler,
    stopScheduler,
    __test,
} from '../scheduler';

const drainPushMock = drainPushReal as MockedFunction<typeof drainPushReal>;

// Minimal navigator.locks stub (jsdom lacks it). Per-name FIFO queue;
// state lives in a module-scoped Map and is RESET in beforeEach so a
// stale "busy=true" doesn't leak between tests.
let lockQueues: Map<string, Array<() => void>> = new Map();
let lockBusy: Map<string, boolean> = new Map();

async function fakeLockRequest(
    name: string,
    _opts: { mode: 'exclusive' },
    cb: () => Promise<void>,
): Promise<void> {
    if (lockBusy.get(name)) {
        await new Promise<void>((startMyTurn) => {
            const queue = lockQueues.get(name) ?? [];
            queue.push(startMyTurn);
            lockQueues.set(name, queue);
        });
    } else {
        lockBusy.set(name, true);
    }
    try {
        await cb();
    } finally {
        const queue = lockQueues.get(name) ?? [];
        const next = queue.shift();
        lockQueues.set(name, queue);
        if (next) {
            // Lock stays busy; wake the next waiter.
            next();
        } else {
            lockBusy.set(name, false);
        }
    }
}

beforeEach(() => {
    lockQueues = new Map();
    lockBusy = new Map();
    Object.defineProperty(navigator, 'locks', {
        configurable: true,
        value: { request: fakeLockRequest },
    });
    Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
    });
    drainPushMock.mockReset();
    drainPushMock.mockResolvedValue({ accepted: 0, rejected: 0 });
});

afterEach(() => {
    stopScheduler();
    vi.useRealTimers();
});

const USER = 'user-1';

// Helper: start scheduler and let the boot kick complete, then clear the mock
// so per-test assertions count only test-driven drains.
async function bootAndClear() {
    startScheduler(USER);
    // Boot kick is async (microtasks + lock). Flush a few cycles.
    for (let i = 0; i < 20; i++) await Promise.resolve();
    drainPushMock.mockClear();
}

describe('scheduler — debounce', () => {
    it('scheduleHot collapses many calls into a single drain after 100ms', async () => {
        await bootAndClear();
        vi.useFakeTimers();

        scheduleHot();
        scheduleHot();
        scheduleHot();
        await vi.advanceTimersByTimeAsync(50);
        expect(drainPushMock).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(60); // total 110 > 100
        // drainPush is called inside navigator.locks.request — flush microtasks.
        for (let i = 0; i < 10; i++) await Promise.resolve();
        expect(drainPushMock).toHaveBeenCalledTimes(1);
    });

    it('scheduleCold debounces at 30s', async () => {
        await bootAndClear();
        vi.useFakeTimers();

        scheduleCold();
        await vi.advanceTimersByTimeAsync(29_000);
        expect(drainPushMock).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(2_000);
        for (let i = 0; i < 10; i++) await Promise.resolve();
        expect(drainPushMock).toHaveBeenCalledTimes(1);
    });

    it('scheduleHot called after scheduleCold cancels the cold timer (latest-wins)', async () => {
        await bootAndClear();
        vi.useFakeTimers();

        scheduleCold();
        await vi.advanceTimersByTimeAsync(50);
        scheduleHot();
        await vi.advanceTimersByTimeAsync(150);
        for (let i = 0; i < 10; i++) await Promise.resolve();
        expect(drainPushMock).toHaveBeenCalledTimes(1);
        // Cold's 30s slot must not fire a second drain.
        await vi.advanceTimersByTimeAsync(30_000);
        for (let i = 0; i < 10; i++) await Promise.resolve();
        expect(drainPushMock).toHaveBeenCalledTimes(1);
    });

    it('schedule*/Hot/Cold are no-ops before startScheduler()', async () => {
        // Don't call startScheduler.
        vi.useFakeTimers();
        scheduleHot();
        scheduleCold();
        await vi.advanceTimersByTimeAsync(60_000);
        for (let i = 0; i < 10; i++) await Promise.resolve();
        expect(drainPushMock).not.toHaveBeenCalled();
    });
});

describe('scheduler — leader lock', () => {
    it('serialises overlapping drainNow calls (single-tab leader)', async () => {
        // bootAndClear sets currentUserId so __test.drainNow doesn't no-op,
        // and resets the mock so per-test counts are clean.
        await bootAndClear();

        let inFlight = 0;
        let maxInFlight = 0;
        let release!: () => void;
        const firstReached = new Promise<void>((reachedSig) => {
            let signaledFirst = false;
            drainPushMock.mockImplementation(async () => {
                inFlight += 1;
                if (inFlight > maxInFlight) maxInFlight = inFlight;
                if (!signaledFirst) {
                    signaledFirst = true;
                    reachedSig();
                    await new Promise<void>((r) => (release = r));
                }
                inFlight -= 1;
                return { accepted: 0, rejected: 0 };
            });
        });

        const p1 = __test.drainNow();
        await firstReached;

        const p2 = __test.drainNow();
        for (let i = 0; i < 20; i++) await Promise.resolve();
        // Lock must keep p2 OUT until p1 finishes.
        expect(inFlight).toBe(1);

        release();
        await Promise.all([p1, p2]);
        expect(drainPushMock).toHaveBeenCalledTimes(2);
        expect(maxInFlight, 'lock failed to serialise calls').toBe(1);
    });
});

describe('scheduler — events', () => {
    it('window "online" event triggers a drain', async () => {
        await bootAndClear();
        window.dispatchEvent(new Event('online'));
        for (let i = 0; i < 20; i++) await Promise.resolve();
        expect(drainPushMock).toHaveBeenCalledTimes(1);
    });

    it('document "visibilitychange" → visible triggers a drain', async () => {
        await bootAndClear();
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
        document.dispatchEvent(new Event('visibilitychange'));
        for (let i = 0; i < 20; i++) await Promise.resolve();
        expect(drainPushMock).toHaveBeenCalledTimes(1);
    });

    it('visibilitychange while hidden does NOT trigger a drain', async () => {
        await bootAndClear();
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
        for (let i = 0; i < 20; i++) await Promise.resolve();
        expect(drainPushMock).not.toHaveBeenCalled();
    });
});
