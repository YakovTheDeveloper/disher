import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Guards the «Уточнения» comment threading through the MIDDLE layer of the
// flow: submitDishName(name, comment) → startIntake → startFetch →
// parseDishName(text, requestId, comment, signal). The lower boundary
// (parseDishName body shape) and the backend are covered elsewhere; this proves
// the hook actually forwards the comment instead of dropping it on the floor.

const parseDishNameMock = vi.fn();
const parseFreeTextFoodMock = vi.fn();

vi.mock('../../api/parseDishName', () => ({
  parseDishName: (...args: unknown[]) => parseDishNameMock(...args),
}));
vi.mock('../../api/parseFreeTextFood', () => ({
  parseFreeTextFood: (...args: unknown[]) => parseFreeTextFoodMock(...args),
}));
// Avoid the unmount `abandon` telemetry hitting the network.
vi.mock('../../telemetry', () => ({
  sendMatcherTelemetry: vi.fn(),
}));

import { useWriteFoodFlow } from '../useWriteFoodFlow';

const EMPTY_PARSE = { requestId: 'srv-1', resolved: [], ambiguous: [], unresolved: [] };
const TARGET = { kind: 'dish' as const, dishId: 'dish-1' };

beforeEach(() => {
  parseDishNameMock.mockReset();
  parseDishNameMock.mockResolvedValue(EMPTY_PARSE);
  parseFreeTextFoodMock.mockReset();
  parseFreeTextFoodMock.mockResolvedValue(EMPTY_PARSE);
  window.sessionStorage.clear();
});

afterEach(() => {
  window.sessionStorage.clear();
});

describe('useWriteFoodFlow — submitDishName comment threading', () => {
  it('forwards the «Уточнения» comment to parseDishName', async () => {
    const { result } = renderHook(() => useWriteFoodFlow(TARGET));

    act(() => {
      result.current.submitDishName('борщ', 'вегетарианский');
    });

    await waitFor(() => expect(parseDishNameMock).toHaveBeenCalledTimes(1));
    expect(parseDishNameMock).toHaveBeenCalledWith(
      'борщ',
      expect.any(String), // caller-owned requestId (X-Request-Id)
      'вегетарианский',
      expect.anything(), // AbortSignal
    );
    expect(parseFreeTextFoodMock).not.toHaveBeenCalled();
  });

  it('passes undefined comment when «Предложить» runs without a clarification', async () => {
    const { result } = renderHook(() => useWriteFoodFlow(TARGET));

    act(() => {
      result.current.submitDishName('борщ');
    });

    await waitFor(() => expect(parseDishNameMock).toHaveBeenCalledTimes(1));
    // Args: (dishName, requestId, comment, signal) — comment is the 3rd arg now.
    expect(parseDishNameMock.mock.calls[0][2]).toBeUndefined();
  });
});
