import { memo, useCallback, useMemo, useState, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { drawerStore, modalStore } from '@/shared/ui';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
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

// Stripe-fork palette forks for the analysis rows — flip live via the
// DesignVariantsBar. `warm` (honey/peach) is the leaning canon default.
const PALETTE_VARIANTS = ['warm', 'graphite', 'sand', 'mint'] as const;

// AnalysesPage slide 1 — the long-analyses list. The list is NOT polled;
// useAnalysesList refetches on mount + tab refocus. A freshly created row is
// merged in optimistically so it shows as «идёт» without waiting for the
// refetch to land.
const AnalysesSlide = ({ topBar }: Props) => {
  const { data, refetch } = useAnalysesList();
  const [optimistic, setOptimistic] = useState<Analysis[]>([]);
  const { anchor } = useDesignVariant('LabAnalysis', PALETTE_VARIANTS);

  // Optimistic rows first, then the server list with duplicates dropped.
  const analyses = useMemo(() => {
    const server = data ?? [];
    const serverIds = new Set(server.map((a) => a.id));
    return [...optimistic.filter((a) => !serverIds.has(a.id)), ...server];
  }, [data, optimistic]);

  const openCreate = useCallback(async () => {
    const created = await drawerStore.show(CreateLongAnalysisDrawer, {});
    if (created) {
      setOptimistic((prev) => [created, ...prev]);
      refetch();
    }
  }, [refetch]);

  const openDetail = useCallback(
    (id: string) => {
      const analysis = analyses.find((a) => a.id === id);
      if (analysis) void modalStore.show(AnalysisDetailModal, { analysis });
    },
    [analyses],
  );

  const bottomBar = (
    <AppBottomBarShell side="left">
      <button type="button" className={styles.cta} onClick={openCreate}>
        + Анализ
      </button>
    </AppBottomBarShell>
  );

  const loading = data === null && optimistic.length === 0;

  return (
    <Screen stickyTop={topBar} headerOverlap bottomBar={bottomBar}>
      <div className={styles.container}>
        {loading ? (
          <div className={styles.centered}>
            <Spinner />
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
            <div className={styles.listBody} {...anchor}>
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
