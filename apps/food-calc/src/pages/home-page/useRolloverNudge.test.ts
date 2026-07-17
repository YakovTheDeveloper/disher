import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }));

// Only useNavigate is used by the hook — full-mock react-router-dom so the test
// needs no Router context.
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateSpy }));

vi.mock('@/shared/lib/toaster/toaster', () => ({
  default: {
    notify: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

import toaster from '@/shared/lib/toaster/toaster';
import { useRolloverNudge } from './useRolloverNudge';

const notifyMock = vi.mocked(toaster.notify);

// June 14 2026 10:00 local → key "14-06-2026"; next day → "15-06-2026".
const DAY_14 = new Date(2026, 5, 14, 10, 0, 0);
const DAY_15 = new Date(2026, 5, 15, 8, 0, 0);

function fireVisible() {
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(DAY_14);
  navigateSpy.mockReset();
  notifyMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useRolloverNudge', () => {
  it('offers to jump to today when the day rolled over and the user was following today', () => {
    renderHook(() => useRolloverNudge('14-06-2026'));

    vi.setSystemTime(DAY_15);
    fireVisible();

    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith('Наступил новый день', expect.any(Object));

    // The action navigates to the fresh today.
    const opts = notifyMock.mock.calls[0][1];
    opts?.action?.onClick?.();
    expect(navigateSpy).toHaveBeenCalledWith('/schedule/15-06-2026');
  });

  it('stays silent on a deliberately chosen historical date', () => {
    renderHook(() => useRolloverNudge('01-06-2026'));

    vi.setSystemTime(DAY_15);
    fireVisible();

    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('stays silent when the day has not changed (same-day refocus)', () => {
    renderHook(() => useRolloverNudge('14-06-2026'));

    fireVisible(); // still DAY_14

    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('does not nudge twice for the same new day', () => {
    renderHook(() => useRolloverNudge('14-06-2026'));

    vi.setSystemTime(DAY_15);
    fireVisible();
    fireVisible();

    expect(notifyMock).toHaveBeenCalledTimes(1);
  });

  it('ignores the event while the document is hidden', () => {
    const spy = vi
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('hidden');
    renderHook(() => useRolloverNudge('14-06-2026'));

    vi.setSystemTime(DAY_15);
    fireVisible();

    expect(notifyMock).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
