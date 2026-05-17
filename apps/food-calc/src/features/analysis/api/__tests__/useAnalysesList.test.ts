import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// authedFetch is the only external dependency — mock it.
vi.mock('@/shared/lib/api/authedFetch', () => ({ authedFetch: vi.fn() }));

import { authedFetch } from '@/shared/lib/api/authedFetch';
import { useAnalysesList } from '../queries';

const mockFetch = vi.mocked(authedFetch);

function listResponse(ids: string[]): Response {
  const analyses = ids.map((id) => ({
    id,
    window_start: '2026-05-01T00:00:00Z',
    window_end: '2026-05-15T00:00:00Z',
    result_md: '## ok',
    idea_cards: [],
    applied_hypotheses: [],
    created_at: '2026-05-15T12:00:00Z',
  }));
  return {
    ok: true,
    status: 200,
    json: async () => ({ analyses }),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('useAnalysesList', () => {
  it('fetches the list on mount and maps the rows', async () => {
    mockFetch.mockResolvedValueOnce(listResponse(['a', 'b']));
    const { result } = renderHook(() => useAnalysesList());

    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.data?.map((a) => a.id)).toEqual(['a', 'b']);
    expect(result.current.error).toBeNull();
  });

  it('a slow earlier fetch never overwrites a newer one (req-id guard)', async () => {
    let resolveSlow!: (r: Response) => void;
    mockFetch
      // mount fetch (req 1) — hangs until we release it.
      .mockReturnValueOnce(
        new Promise<Response>((res) => {
          resolveSlow = res;
        }),
      )
      // refetch (req 2) — resolves immediately with the newer list.
      .mockResolvedValueOnce(listResponse(['fresh']));

    const { result } = renderHook(() => useAnalysesList());
    act(() => result.current.refetch());

    await waitFor(() =>
      expect(result.current.data?.map((a) => a.id)).toEqual(['fresh']),
    );

    // The stale req-1 response lands late — it must be discarded.
    resolveSlow(listResponse(['stale']));
    await new Promise((r) => setTimeout(r, 30));
    expect(result.current.data?.map((a) => a.id)).toEqual(['fresh']);
  });

  it('records an error and leaves data null when the fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    const { result } = renderHook(() => useAnalysesList());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.data).toBeNull();
  });
});
