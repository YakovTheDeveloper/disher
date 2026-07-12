import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Fix D3: a manual retry reuses the failed attempt's X-Request-Id so a
// lost-response retry of the SAME text dedups the charge server-side. But an
// EDITED text is a different logical request — reusing the id there would dedup
// the charge to zero and parse the new text for free. So: same text → reuse id,
// changed text → fresh id.

const parseFreeTextFoodMock = vi.fn();
vi.mock('../../api/parseFreeTextFood', () => ({
  parseFreeTextFood: (...args: unknown[]) => parseFreeTextFoodMock(...args),
}));
const parseDishNameMock = vi.fn();
vi.mock('../../api/parseDishName', () => ({
  parseDishName: (...args: unknown[]) => parseDishNameMock(...args),
}));
// Keep the unmount `abandon` telemetry off the network.
vi.mock('../../telemetry', () => ({ sendMatcherTelemetry: vi.fn() }));

import { useWriteFoodFlow } from '../useWriteFoodFlow';

const TARGET = { kind: 'schedule' as const, date: '10-07-2026' };

beforeEach(() => {
  parseDishNameMock.mockReset();
  parseFreeTextFoodMock.mockReset();
  // Never-settling promise: the flow stays 'loading', so the input text is
  // retained (a resolved/errored parse would clear or toast) and the persisted
  // attempt (id + inputText) is readable by retry().
  parseFreeTextFoodMock.mockReturnValue(new Promise(() => {}));
  window.sessionStorage.clear();
});

afterEach(() => window.sessionStorage.clear());

describe('useWriteFoodFlow — manual retry requestId (fix D3)', () => {
  it('reuses the id when retrying the SAME text (lost-response idempotency)', async () => {
    const { result } = renderHook(() => useWriteFoodFlow(TARGET));

    act(() => result.current.submit('омлет'));
    await waitFor(() => expect(parseFreeTextFoodMock).toHaveBeenCalledTimes(1));

    act(() => result.current.retry());
    await waitFor(() => expect(parseFreeTextFoodMock).toHaveBeenCalledTimes(2));

    const id1 = parseFreeTextFoodMock.mock.calls[0][1];
    const id2 = parseFreeTextFoodMock.mock.calls[1][1];
    expect(id1).toBeTruthy();
    expect(id2).toBe(id1); // same request → server dedups the charge
  });

  it('mints a FRESH id when the text was edited before retrying', async () => {
    const { result } = renderHook(() => useWriteFoodFlow(TARGET));

    act(() => result.current.submit('омлет'));
    await waitFor(() => expect(parseFreeTextFoodMock).toHaveBeenCalledTimes(1));

    act(() => result.current.setInputText('борщ'));
    act(() => result.current.retry());
    await waitFor(() => expect(parseFreeTextFoodMock).toHaveBeenCalledTimes(2));

    const id1 = parseFreeTextFoodMock.mock.calls[0][1];
    const id2 = parseFreeTextFoodMock.mock.calls[1][1];
    // Different logical request — must NOT reuse the id.
    expect(id2).not.toBe(id1);
    // Sanity: the second call parsed the NEW text.
    expect(parseFreeTextFoodMock.mock.calls[1][0]).toBe('борщ');
  });
});
