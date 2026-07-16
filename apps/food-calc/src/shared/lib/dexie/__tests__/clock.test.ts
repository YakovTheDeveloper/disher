import { describe, it, expect, beforeEach } from 'vitest';
import { nextStamp, observeStamp, resetClock } from '@/shared/lib/dexie/write';

// The monotonic high-water clock behind `updated_at`. It must never emit a stamp
// that goes backwards relative to (a) stamps it already issued or (b) stamps it
// observed from a peer via observeStamp() — that monotonicity is what stops a
// wrong wall clock from silently losing a genuinely-later edit on merge().

const HWM_KEY = 'disher.clock.hwm';

describe('monotonic high-water clock', () => {
  beforeEach(() => {
    localStorage.removeItem(HWM_KEY); // start each test from a clean floor
  });

  it('nextStamp() is strictly increasing even within the same millisecond', () => {
    const stamps = Array.from({ length: 5 }, () => nextStamp());
    const ms = stamps.map((s) => Date.parse(s));
    for (let i = 1; i < ms.length; i++) {
      expect(ms[i]).toBeGreaterThan(ms[i - 1]); // +1ms bump guarantees strict order
    }
  });

  it('nextStamp() never drops below an observed (near-future) peer stamp', () => {
    // A plausibly-fast peer, inside the accepted skew ceiling (well under a day).
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    observeStamp(future);

    const s = nextStamp();
    // A behind wall clock would emit "now" (< future); the high-water mark forces
    // the next stamp strictly past the peer's.
    expect(Date.parse(s)).toBeGreaterThan(Date.parse(future));
  });

  it('keeps issuing strictly-increasing stamps after observing a future stamp', () => {
    observeStamp(new Date(Date.now() + 60 * 60 * 1000).toISOString());
    const a = Date.parse(nextStamp());
    const b = Date.parse(nextStamp());
    expect(b).toBeGreaterThan(a);
  });

  it('observeStamp() refuses a far-future poison stamp (И-17)', () => {
    const before = Date.parse(nextStamp()); // sane near-now floor
    observeStamp('9999-12-31T23:59:59.999Z'); // hand-edited export / broken formatter
    const after = Date.parse(nextStamp());
    // The mark must NOT have jumped to year 9999 — the next stamp stays near now,
    // just past the previous one, not centuries ahead.
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThan(Date.now() + 24 * 60 * 60 * 1000);
  });

  it('resetClock() clears the persisted high-water mark (И-13)', () => {
    observeStamp(new Date(Date.now() + 60 * 60 * 1000).toISOString());
    expect(Number(localStorage.getItem(HWM_KEY))).toBeGreaterThan(Date.now());
    resetClock();
    expect(localStorage.getItem(HWM_KEY)).toBeNull();
  });

  it('observeStamp() ignores absent / unparseable input without throwing', () => {
    expect(() => observeStamp(undefined)).not.toThrow();
    expect(() => observeStamp('')).not.toThrow();
    expect(() => observeStamp('not-a-date')).not.toThrow();
    // A garbage observation must not poison the floor — a fresh stamp is still
    // a sane near-now value, not NaN.
    expect(Number.isFinite(Date.parse(nextStamp()))).toBe(true);
  });

  it('the high-water mark survives across calls via localStorage', () => {
    const first = Date.parse(nextStamp());
    // Simulate a reload: a new caller reads the persisted floor, not a reset 0.
    expect(Number(localStorage.getItem(HWM_KEY))).toBe(first);
    const second = Date.parse(nextStamp());
    expect(second).toBeGreaterThan(first);
  });
});
