import { describe, it, expect, beforeEach } from 'vitest';
import { nextStamp, observeStamp } from '@/shared/lib/dexie/write';

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

  it('nextStamp() never drops below an observed (future) peer stamp', () => {
    const future = '2099-01-01T00:00:00.000Z';
    observeStamp(future);

    const s = nextStamp();
    // A behind wall clock would emit "now" (< 2099); the high-water mark forces
    // the next stamp strictly past the peer's.
    expect(Date.parse(s)).toBeGreaterThan(Date.parse(future));
  });

  it('keeps issuing strictly-increasing stamps after observing a future stamp', () => {
    observeStamp('2099-01-01T00:00:00.000Z');
    const a = Date.parse(nextStamp());
    const b = Date.parse(nextStamp());
    expect(b).toBeGreaterThan(a);
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
