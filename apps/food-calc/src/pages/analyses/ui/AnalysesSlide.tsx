import { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { drawerStore, modalStore } from '@/shared/ui';
import Button from '@/shared/ui/atoms/Button/Button';
import FlaskIcon from '@/shared/assets/icons/flask.svg?react';
import { openHypotheses } from '@/widgets/Laboratory/openHypotheses';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { useAnalysesList, type Analysis } from '@/features/analysis/api';
import {
  AnalysisListItem,
  AnalysisDetailModal,
  CreateLongAnalysisDrawer,
} from '@/features/analysis/long';
import styles from './AnalysesSlide.module.scss';

type Props = {
  topBar: ReactNode;
};

// AnalysesPage slide 1 — the long-analyses list. The list is NOT polled;
// useAnalysesList refetches on mount + tab refocus. A freshly created (or
// restarted) row is merged in optimistically so it shows as «идёт» without
// waiting for the refetch to land.
const AnalysesSlide = ({ topBar }: Props) => {
  const { data, error, refetch } = useAnalysesList();
  const [optimistic, setOptimistic] = useState<Analysis[]>([]);

  // Optimistic rows first, then the server list with duplicates dropped.
  const analyses = useMemo(() => {
    const server = data ?? [];
    const serverIds = new Set(server.map((a) => a.id));
    return [...optimistic.filter((a) => !serverIds.has(a.id)), ...server];
  }, [data, optimistic]);

  const addOptimistic = useCallback(
    (a: Analysis) => {
      setOptimistic((prev) => [a, ...prev]);
      refetch();
    },
    [refetch],
  );

  const openCreate = useCallback(async () => {
    const created = await drawerStore.show(CreateLongAnalysisDrawer, {});
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
    [analyses, addOptimistic],
  );

  // Unified with HomePage: «Гипотезы» (left → shared HypothesesDrawer) +
  // «+ Анализ» (right → CreateLongAnalysisDrawer, surface-specific — здесь это
  // длительный разбор, в отличие от HomePage, где правый слот = дневной/долгий
  // chooser).
  const bottomBar = (
    <AppBottomBarShell side="split">
      <Button
        variant="bottomActionBar"
        onClick={() => void openHypotheses()}
        icon={<FlaskIcon width={16} height={16} />}
      >
        Гипотезы
      </Button>
      <button type="button" className={styles.cta} onClick={openCreate}>
        + Анализ
      </button>
    </AppBottomBarShell>
  );

  // Distinguish: never-loaded-yet (spinner) vs failed-with-nothing (error).
  const nothingYet = data === null && optimistic.length === 0;
  const loading = nothingYet && error === null;
  const failedToLoad = nothingYet && error !== null;

  return (
    <Screen stickyTop={topBar} headerOverlap bottomBar={bottomBar}>
      <div className={styles.container}>
        {loading ? (
          <div className={styles.centered}>
            <Spinner />
          </div>
        ) : failedToLoad ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Не удалось загрузить</p>
            <p className={styles.emptyBody}>
              Список разборов не подгрузился — проверь сеть.
            </p>
            <button
              type="button"
              className={styles.retry}
              onClick={() => refetch()}
            >
              Повторить
            </button>
          </div>
        ) : analyses.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Разборов пока нет</p>
            <p className={styles.emptyBody}>
              Длительный разбор смотрит на 1–5 недель сразу — еду, события и
              выбранные гипотезы. Запусти первый кнопкой «+ Анализ».
            </p>
          </div>
        ) : (
          <div className={styles.listWrap}>
            <div className={styles.listBody}>
              {analyses.map((a) => (
                <AnalysisListItem
                  key={a.id}
                  analysis={a}
                  onOpen={openDetail}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Screen>
  );
};

export default memo(AnalysesSlide);
