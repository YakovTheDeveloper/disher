import { useCallback, useEffect, useRef, useState } from 'react';
import { authedFetch } from '@/shared/lib/api/authedFetch';
import { API_BASE } from '@/shared/lib/api/base';
import { handleSessionExpired } from '@/features/auth/handleSessionExpired';
import { deriveStatus, mapServerAnalysis, type Analysis } from './types';

// Poll backoff: a long analysis takes ~1–2 min, so a fixed 2s poll is far
// more chatty than useful — especially for a job that has hung. Start gentle
// and grow toward a cap; a fresh analysis still resolves within ~20s of its
// completion, a stuck one isn't hammered.
const POLL_START_MS = 3000;
const POLL_MAX_MS = 20000;
const POLL_GROWTH = 1.6;

// Exponential growth + ±20% jitter (2026 backoff standard): several detail
// modals polling the same window won't align into a synchronized thundering
// herd against the server. Jitter is applied before the cap clamp.
const nextDelay = (prev: number): number => {
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.min(POLL_MAX_MS, Math.round(prev * POLL_GROWTH * jitter));
};

type UseAnalysisResult = {
  data: Analysis | null;
  error: Error | null;
};

// Custom polling hook — server data lives outside Dexie. While result_md is
// empty (pending), refetch with a growing backoff (3s → 20s cap). Failure
// rows have result_md set with the "⚠️ Анализ не удался" prefix; downstream
// code can call isFailedAnalysis to branch.
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
    let delay = POLL_START_MS;
    const url = `${API_BASE}/api/analyses/${id}`;

    const schedule = () => {
      timer = setTimeout(tick, delay);
      delay = nextDelay(delay);
    };

    const tick = async () => {
      try {
        const r = await authedFetch(url);
        if (cancelled) return;
        if (r.status === 404) {
          setError(new Error('analysis not found'));
          return;
        }
        // A mid-session 401 (bearer expired) → shared funnel warns + signs out
        // once. Stop polling; the app flips to AuthScreen.
        if (r.status === 401) {
          handleSessionExpired(r);
          setError(new Error('session expired'));
          return;
        }
        if (!r.ok) {
          setError(new Error(`HTTP ${r.status}`));
          // Retry on transient errors.
          schedule();
          return;
        }
        const body = (await r.json()) as { analysis: Parameters<typeof mapServerAnalysis>[0] };
        if (cancelled) return;
        const analysis = mapServerAnalysis(body.analysis);
        setData(analysis);
        setError(null);
        // Keep polling only while genuinely «идёт». A pending job that has
        // outlived STALE_PENDING_MS is presumed dead — stop polling so the
        // modal does not hammer the server forever (matches the list row,
        // which already shows it as «возможно, не удалось»).
        if (deriveStatus(analysis) === 'running') {
          schedule();
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        schedule();
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

  // Stable `() => void` adapter — `refetch` is already a useCallback, so wrapping
  // the void cast in its own useCallback keeps the returned identity constant
  // across renders. Consumers (useAnalysesFeed) put it in effect/callback deps;
  // a fresh arrow each render would re-subscribe the poll effect and rebuild
  // every downstream callback needlessly.
  const refetchVoid = useCallback(() => void refetch(), [refetch]);

  return { data, error, loading, refetch: refetchVoid };
}
