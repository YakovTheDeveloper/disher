import { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { modalStore } from '@/shared/ui';
import { drawerStore } from '@/shared/ui/drawer-store';
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer';
import Button from '@/shared/ui/atoms/Button/Button';
import FlaskIcon from '@/shared/assets/icons/flask.svg?react';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import {
  useAnalysesList,
  deleteAnalysis,
  type Analysis,
} from '@/features/analysis/api';
import {
  AnalysisListItem,
  AnalysisDetailModal,
  CreateLongAnalysisModal,
  formatWindowLabel,
} from '@/features/analysis/long';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';
import { EmptyState } from '@/shared/ui/EmptyState';
import styles from './AnalysesSlide.module.scss';

// AnalysesPage slide 1 — the long-analyses list. The list is NOT polled;
// useAnalysesList refetches on mount + tab refocus. A freshly created (or
// restarted) row is merged in optimistically so it shows as «идёт» without
// waiting for the refetch to land. Топбар (HomeTopBar) живёт на уровне страницы
// (AnalysesPage), не здесь — поэтому Screen без `stickyTop`.
const AnalysesSlide = () => {
  const { data, error, refetch } = useAnalysesList();
  const [optimistic, setOptimistic] = useState<Analysis[]>([]);
  // Optimistically-removed ids — a deleted row vanishes immediately and stays
  // hidden even before the refetch lands (the server list still carries it for
  // one tick). Rolled back if the DELETE fails.
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const navigate = useNavigate();

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
      setOptimistic((prev) => [a, ...prev]);
      refetch();
    },
    [refetch]
  );

  const openCreate = useCallback(async () => {
    const created = await modalStore.show(CreateLongAnalysisModal, {});
    if (created) addOptimistic(created);
  }, [addOptimistic]);

  const openDetail = useCallback(
    async (id: string) => {
      const analysis = analyses.find((a) => a.id === id);
      if (!analysis) return;
      // The modal resolves with a fresh analysis when the user restarts a
      // stale/failed run — show it right away.
      const restarted = await modalStore.show(AnalysisDetailModal, {
        analysis,
      });
      if (restarted) addOptimistic(restarted);
    },
    [analyses, addOptimistic]
  );

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

  // Long-press → per-row action drawer (canon: delete in the top-right chrome,
  // «Открыть разбор» as the primary action in the stack).
  const openActions = useCallback(
    (analysis: Analysis) => {
      void drawerStore.show(ItemActionsDrawer, {
        title: formatWindowLabel(analysis.windowStart, analysis.windowEnd),
        onDelete: () => deleteOne(analysis.id),
        actions: [
          { label: 'Открыть разбор', onClick: () => openDetail(analysis.id) },
        ],
      });
    },
    [deleteOne, openDetail]
  );

  // Unified with HomePage: «Открытия» (left → /discoveries: гипотезы + инсайты) +
  // «Анализ по неделям» (right → CreateLongAnalysisModal, surface-specific —
  // здесь это длительный разбор, в отличие от HomePage, где правый слот =
  // дневной/долгий chooser).
  const bottomBar = (
    <AppBottomBarShell side="split">
      <Button
        variant="primary"
        onClick={() => navigate('/discoveries')}
        icon={<FlaskIcon width={16} height={16} />}
      >
        Открытия
      </Button>
      <Button variant="primary" onClick={openCreate}>
        Анализ по неделям
      </Button>
    </AppBottomBarShell>
  );

  // Distinguish: never-loaded-yet (spinner) vs failed-with-nothing (error).
  const nothingYet = data === null && optimistic.length === 0;
  const loading = nothingYet && error === null;
  const failedToLoad = nothingYet && error !== null;

  return (
    <Screen headerOverlap bottomBar={bottomBar}>
      <div className={styles.container}>
        {loading ? (
          <div className={styles.centered}>
            <Spinner />
          </div>
        ) : failedToLoad ? (
          <EmptyState
            className={styles.empty}
            title="Не удалось загрузить"
            description="Список разборов не подгрузился — проверь сеть."
            action={
              <Button variant="system-secondary" onClick={() => refetch()}>
                Повторить
              </Button>
            }
          />
        ) : analyses.length === 0 ? (
          <EmptyState
            className={styles.empty}
            title="Разборов пока нет"
            description="Длительный разбор смотрит на 1–5 недель сразу — еду, события и выбранные гипотезы. Запусти первый кнопкой «+ Анализ»."
          />
        ) : (
          <div className={styles.listWrap}>
            <ul className={styles.listBody}>
              {analyses.map((a) => (
                <AnalysisListItem
                  key={a.id}
                  analysis={a}
                  onOpen={openDetail}
                  onLongPress={openActions}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Screen>
  );
};

export default memo(AnalysesSlide);
