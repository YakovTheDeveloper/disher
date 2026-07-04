import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useAnalysesList,
  deleteAnalysis,
  deriveStatus,
  type Analysis,
} from '@/features/analysis/api';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';

// Единый источник данных /analyses: список разборов + оптимистика + удаление +
// поллинг-while-pending. Раздаётся через AnalysesFeedContext, чтобы список
// (AnalysesSlide) и обложка-лоадер (AnalysesHero) видели ОДНИ pending-строки и
// не фетчили `useAnalysesList` дважды. Логика перенесена 1:1 из бывшего
// AnalysesSlide + добавлен поллинг: список сам не поллится, так что «идущий»
// разбор без него никогда бы не перещёлкнулся в «готов».
const POLL_MS = 3000;

export type AnalysesFeed = {
  /** Оптимистика-сверху, затем серверный список без дублей, минус удалённые. */
  analyses: Analysis[];
  /** Идущие разборы (deriveStatus === 'running'), самый свежий первым. */
  pending: Analysis[];
  addOptimistic: (a: Analysis) => void;
  deleteOne: (id: string) => Promise<void>;
  loading: boolean;
  failedToLoad: boolean;
  refetch: () => void;
};

export function useAnalysesFeed(): AnalysesFeed {
  const { data, error, refetch } = useAnalysesList();
  const [optimistic, setOptimistic] = useState<Analysis[]>([]);
  // Optimistically-removed ids — a deleted row vanishes immediately and stays
  // hidden even before the refetch lands (the server list still carries it for
  // one tick). Rolled back if the DELETE fails.
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const navigate = useNavigate();
  const location = useLocation();

  // Optimistic rows first, then the server list with duplicates dropped, minus
  // anything we just deleted.
  const analyses = useMemo(() => {
    const server = data ?? [];
    const serverIds = new Set(server.map((a) => a.id));
    const merged = [...optimistic.filter((a) => !serverIds.has(a.id)), ...server];
    return removedIds.size > 0
      ? merged.filter((a) => !removedIds.has(a.id))
      : merged;
  }, [data, optimistic, removedIds]);

  const addOptimistic = useCallback(
    (a: Analysis) => {
      setOptimistic((prev) =>
        prev.some((x) => x.id === a.id) ? prev : [a, ...prev]
      );
      refetch();
    },
    [refetch]
  );

  // A freshly-started analysis (daily via AnalysisClarificationModal, long via
  // CreateLongAnalysisModal — both opened off the «О!» hub-drawer or the page's
  // «Новый разбор» button) arrives through navigation state. Seed it
  // optimistically so it shows «идёт» at the top before the refetch lands, then
  // clear the state so a back/forward or re-render can't re-seed it.
  useEffect(() => {
    const started = (location.state as { justStarted?: Analysis } | null)
      ?.justStarted;
    if (!started) return;
    addOptimistic(started);
    navigate('.', { replace: true, state: null });
  }, [location.state, addOptimistic, navigate]);

  // Server route: the analysis lives only in Postgres (no Dexie), so deletion is
  // a DELETE /api/analyses/:id round-trip. Hide the row at once; on success toast
  // + refetch, on failure roll the optimistic removal back.
  const deleteOne = useCallback(
    async (id: string) => {
      setRemovedIds((prev) => new Set(prev).add(id));
      const res = await safeMutate(() => deleteAnalysis(id), 'Не удалось удалить');
      if (res.ok) {
        toaster.success('Удалено');
        refetch();
      } else {
        setRemovedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [refetch]
  );

  // Pending rows (still «идёт»), newest first — the Hero loader shows pending[0]
  // and «и ещё N». Status comes from `deriveStatus`, the single source of truth,
  // NOT raw `isPendingAnalysis` (summary===''): a job that died (summary=''
  // forever) crosses STALE_PENDING_MS into 'stale', drops out of `pending`, and
  // so stops both the Hero loader and the poll below — otherwise it would spin +
  // refetch every 3s forever while the list row already reads «возможно, не
  // удалось».
  const pending = useMemo(
    () =>
      analyses
        .filter((a) => deriveStatus(a) === 'running')
        .slice()
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [analyses]
  );

  // Poll while anything is running. useAnalysesList refetches only on mount /
  // tab-refocus, so a running analysis would never flip to «готов» on its own —
  // this interval keeps refetching until the last running row resolves (or ages
  // into 'stale'), then the effect tears the timer down (no idle polling). While
  // it polls, the 3s re-render re-evaluates `deriveStatus` so the running→stale
  // crossing is caught within one tick.
  const hasPending = pending.length > 0;
  useEffect(() => {
    if (!hasPending) return;
    const timer = setInterval(refetch, POLL_MS);
    return () => clearInterval(timer);
  }, [hasPending, refetch]);

  // Distinguish: never-loaded-yet (spinner) vs failed-with-nothing (error).
  const nothingYet = data === null && optimistic.length === 0;
  const loading = nothingYet && error === null;
  const failedToLoad = nothingYet && error !== null;

  return { analyses, pending, addOptimistic, deleteOne, loading, failedToLoad, refetch };
}
