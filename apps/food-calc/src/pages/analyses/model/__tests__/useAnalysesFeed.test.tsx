import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// react-router-dom — the hook only touches useNavigate + useLocation. Full-mock
// so the test needs no Router context; `locationState.current` feeds the
// `justStarted` seed path.
const { navigateSpy, locationState } = vi.hoisted(() => ({
  navigateSpy: vi.fn(),
  locationState: { current: null as unknown },
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateSpy,
    useLocation: () => ({ state: locationState.current }),
  };
});

// authedFetch is the only network dependency of useAnalysesList underneath.
vi.mock('@/shared/lib/api/authedFetch', () => ({ authedFetch: vi.fn() }));

import { authedFetch } from '@/shared/lib/api/authedFetch';
import { useAnalysesFeed } from '../useAnalysesFeed';
import { useAnalysesFeedContext } from '../AnalysesFeedContext';
import type { Analysis } from '@/features/analysis/api';

const mockFetch = vi.mocked(authedFetch);

// Fixed clock so deriveStatus (Date.now-driven) is deterministic. Row ages are
// expressed relative to BASE.
const BASE = new Date('2026-05-15T12:00:00Z');
const POLL_MS = 3000;
const STALE_MS = 15 * 60 * 1000;

const agoIso = (ms: number): string => new Date(BASE.getTime() - ms).toISOString();

type ServerRow = {
  id: string;
  window_start: string;
  window_end: string;
  result_md: string;
  idea_cards: unknown[];
  insights: unknown[];
  observations: unknown[];
  applied_hypotheses: unknown[];
  created_at: string;
};

function serverRow(over: Partial<ServerRow>): ServerRow {
  return {
    id: 'a-1',
    window_start: '2026-05-01T00:00:00Z',
    window_end: '2026-05-08T00:00:00Z',
    result_md: '',
    idea_cards: [],
    insights: [],
    observations: [],
    applied_hypotheses: [],
    created_at: agoIso(0),
    ...over,
  };
}

function listResponse(rows: ServerRow[]): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ analyses: rows }),
  } as unknown as Response;
}

function analysis(over: Partial<Analysis>): Analysis {
  return {
    id: 'seed-1',
    windowStart: '2026-05-01T00:00:00Z',
    windowEnd: '2026-05-08T00:00:00Z',
    summary: '',
    observations: [],
    insights: [],
    hypotheses: [],
    appliedHypotheses: [],
    createdAt: agoIso(0),
    ...over,
  };
}

// Drain the pending fetch promise chain + any due timers, then let React commit.
async function flush(ms = 0): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
  mockFetch.mockReset();
  navigateSpy.mockReset();
  locationState.current = null;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAnalysesFeed — pending gated on deriveStatus', () => {
  it('keeps a running job in `pending` and polls it', async () => {
    mockFetch.mockResolvedValue(
      listResponse([serverRow({ result_md: '', created_at: agoIso(0) })]),
    );

    const { result } = renderHook(() => useAnalysesFeed());
    await flush();

    expect(result.current.pending).toHaveLength(1);
    const afterMount = mockFetch.mock.calls.length;

    // The while-pending interval fires within one POLL_MS tick.
    await flush(POLL_MS);
    expect(mockFetch.mock.calls.length).toBeGreaterThan(afterMount);
  });

  it('drops a stale (dead) job from `pending` and does NOT poll it', async () => {
    // summary='' but older than STALE_PENDING_MS ⇒ deriveStatus → 'stale'.
    mockFetch.mockResolvedValue(
      listResponse([serverRow({ result_md: '', created_at: agoIso(STALE_MS + 60_000) })]),
    );

    const { result } = renderHook(() => useAnalysesFeed());
    await flush();

    // Regression on Bug #1: the Hero loader (driven by `pending`) is off and no
    // 3s poll spins forever against a job that will never resolve.
    expect(result.current.pending).toHaveLength(0);
    const afterMount = mockFetch.mock.calls.length;

    await flush(POLL_MS * 3);
    expect(mockFetch.mock.calls.length).toBe(afterMount);
  });

  it('drops a completed job from `pending` and stops polling', async () => {
    mockFetch.mockResolvedValue(
      listResponse([serverRow({ result_md: '## готовый разбор', created_at: agoIso(0) })]),
    );

    const { result } = renderHook(() => useAnalysesFeed());
    await flush();

    expect(result.current.pending).toHaveLength(0);
    const afterMount = mockFetch.mock.calls.length;

    await flush(POLL_MS * 3);
    expect(mockFetch.mock.calls.length).toBe(afterMount);
  });

  it('orders `pending` newest-first (Hero caption reads pending[0])', async () => {
    mockFetch.mockResolvedValue(
      listResponse([
        serverRow({ id: 'old', result_md: '', created_at: agoIso(5 * 60 * 1000) }),
        serverRow({ id: 'new', result_md: '', created_at: agoIso(0) }),
      ]),
    );

    const { result } = renderHook(() => useAnalysesFeed());
    await flush();

    expect(result.current.pending.map((a) => a.id)).toEqual(['new', 'old']);
  });
});

describe('useAnalysesFeed — justStarted seed', () => {
  it('seeds the started analysis once and clears location.state', async () => {
    locationState.current = { justStarted: analysis({ id: 'started', createdAt: agoIso(0) }) };
    mockFetch.mockResolvedValue(listResponse([]));

    const { result } = renderHook(() => useAnalysesFeed());
    await flush();

    // Optimistic row is present immediately, ahead of the (empty) server list.
    expect(result.current.analyses.map((a) => a.id)).toContain('started');
    // The state is wiped exactly once so a re-render / back-forward can't re-seed.
    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('.', { replace: true, state: null });
  });
});

describe('useAnalysesFeedContext', () => {
  it('throws when used outside the provider', () => {
    // renderHook surfaces the thrown error rather than rejecting.
    expect(() => renderHook(() => useAnalysesFeedContext())).toThrow(
      /must be used within/,
    );
  });
});
