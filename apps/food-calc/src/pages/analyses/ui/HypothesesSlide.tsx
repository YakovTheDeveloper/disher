import { memo, useCallback, useMemo, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { drawerStore } from '@/shared/ui';
import { useAllHypotheses } from '@/entities/hypothesis';
import {
  CreateHypothesisDrawer,
  openEditHypothesisDrawer,
} from '@/features/analysis/hypothesis-drawers';
import HypothesisListPanel from '@/widgets/Laboratory/HypothesisListPanel';
import styles from './HypothesesSlide.module.scss';

type Props = {
  topBar: ReactNode;
};

const noop = () => {};

// AnalysesPage slide 0 — a pure hypothesis CRUD list. No selection here
// (`selectable={false}` hides the checkboxes); a tap opens the edit drawer.
const HypothesesSlide = ({ topBar }: Props) => {
  const hypotheses = useAllHypotheses();
  // Stable empty selection — this slide never selects.
  const emptySelection = useMemo(() => new Set<string>(), []);

  const openCreate = useCallback(() => {
    void drawerStore.show(CreateHypothesisDrawer, {});
  }, []);

  const bottomBar = (
    <AppBottomBarShell side="left">
      <button type="button" className={styles.cta} onClick={openCreate}>
        + Гипотеза
      </button>
    </AppBottomBarShell>
  );

  return (
    <Screen stickyTop={topBar} headerOverlap bottomBar={bottomBar}>
      <div className={styles.container}>
        <HypothesisListPanel
          hypotheses={hypotheses}
          selectedIds={emptySelection}
          onToggle={noop}
          onEditHypothesis={openEditHypothesisDrawer}
          selectable={false}
          maxBodyHeight="74vh"
        />
      </div>
    </Screen>
  );
};

export default memo(HypothesesSlide);
