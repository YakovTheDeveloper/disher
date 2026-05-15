import { useCallback, useEffect, useRef, useState } from 'react';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { API_BASE } from '@/shared/lib/api/base';
import { isPendingAnalysis, mapServerAnalysis, type Analysis } from './types';

const POLL_INTERVAL_MS = 2000;

type UseAnalysisResult = {
  data: Analysis | null;
  error: Error | null;
};

// Custom polling hook — server data lives outside Dexie. While result_md is
// empty (pending), refetch every 2s. Failure rows have result_md set with the
// "⚠️ Анализ не удался" prefix; downstream code can call isFailedAnalysis to
// branch.
export function useAnalysis(id: string | undefined): UseAnalysisResult {
  const [data, setData] = useState<Analysis | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const url = `${API_BASE}/api/analyses/${id}`;

    const tick = async () => {
      try {
        const r = await authedFetch(url);
        if (cancelled) return;
        if (r.status === 404) {
          setError(new Error('analysis not found'));
          return;
        }
        if (!r.ok) {
          setError(new Error(`HTTP ${r.status}`));
          // Retry on transient errors.
          timer = setTimeout(tick, POLL_INTERVAL_MS);
          return;
        }
        const body = (await r.json()) as { analysis: Parameters<typeof mapServerAnalysis>[0] };
        if (cancelled) return;
        const analysis = mapServerAnalysis(body.analysis);
        setData(analysis);
        setError(null);
        if (isPendingAnalysis(analysis)) {
          timer = setTimeout(tick, POLL_INTERVAL_MS);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        timer = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  return { data, error };
}

type UseAnalysesListResult = {
  data: Analysis[] | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
};

// List of the current user's long analyses. The list itself is NOT polled —
// a freshly created «идёт» row won't flip to «готов» on its own. Instead the
// page refetches on mount and on `visibilitychange` (tab refocus), which is
// when the user could plausibly expect newer state. Detail polling lives in
// useAnalysis(id), opened from the detail modal.
export function useAnalysesList(): UseAnalysesListResult {
  const [data, setData] = useState<Analysis[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  // Monotonic request id — a slow earlier fetch must not overwrite a newer one.
  const reqRef = useRef(0);

  const refetch = useCallback(async () => {
    const req = ++reqRef.current;
    setLoading(true);
    try {
      const r = await authedFetch(`${API_BASE}/api/analyses`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const body = (await r.json()) as {
        analyses: Parameters<typeof mapServerAnalysis>[0][];
      };
      if (req !== reqRef.current) return;
      setData(body.analyses.map(mapServerAnalysis));
      setError(null);
    } catch (e) {
      if (req !== reqRef.current) return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (req === reqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refetch();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refetch]);

  return { data, error, loading, refetch: () => void refetch() };
}
