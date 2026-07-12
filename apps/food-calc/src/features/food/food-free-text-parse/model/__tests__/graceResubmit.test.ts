import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Fix #4: a reload MID-PARSE remounts the flow, which re-issues the in-flight
// request within a 60s grace window. It used to mint a FRESH requestId for that
// resubmit — so if the original had already reached the server and charged, the
// resubmit slipped past X-Request-Id idempotency and debited a SECOND time. The
// resubmit must now reuse the persisted requestId.

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
import { writeParseState } from '../parseStateStorage';

const EMPTY_PARSE = { requestId: 'srv-1', resolved: [], ambiguous: [], unresolved: [] };
const TARGET = { kind: 'schedule' as const, date: '10-07-2026' };

beforeEach(() => {
  parseFreeTextFoodMock.mockReset();
  parseFreeTextFoodMock.mockResolvedValue(EMPTY_PARSE);
  parseDishNameMock.mockReset();
  parseDishNameMock.mockResolvedValue(EMPTY_PARSE);
  window.sessionStorage.clear();
});

afterEach(() => window.sessionStorage.clear());

describe('useWriteFoodFlow — grace-resubmit idempotency (fix #4)', () => {
  it('reuses persisted.requestId when re-issuing an in-flight parse after a reload', async () => {
    // A 'loading' state persisted moments ago = a parse that was in flight when
    // the page reloaded (within the 60s grace window).
    writeParseState({
      target: TARGET,
      status: 'loading',
      inputText: 'омлет',
      startedAt: Date.now(),
      requestId: 'original-req-id',
      intake: 'text',
    });

    renderHook(() => useWriteFoodFlow(TARGET));

    await waitFor(() => expect(parseFreeTextFoodMock).toHaveBeenCalledTimes(1));
    // Same id as the original in-flight request — NOT a freshly minted one.
    expect(parseFreeTextFoodMock).toHaveBeenCalledWith(
      'омлет',
      'original-req-id',
      expect.anything(), // AbortSignal
    );
  });
});
