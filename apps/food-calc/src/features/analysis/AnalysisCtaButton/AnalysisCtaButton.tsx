import { memo } from 'react';
import { drawerStore } from '@/shared/ui';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import { AnalysisKindDrawer } from '../AnalysisKindDrawer';
import Button from '@/shared/ui/atoms/Button/Button';
import styles from './AnalysisCtaButton.module.scss';

type Props = {
  date: string;
};

// HomePage bottom-bar CTA «Анализ» — `Button.bottomActionBar` (единый вид
// кнопок нижнего бара). Opens AnalysisKindDrawer (daily vs long); the daily
// path then opens the clarification modal (hypothesis pick + note). While a
// daily stream for this date is running it shows a spinner and is disabled;
// otherwise it is always active (offline / empty-day gating lives on the
// «текущий день» option inside the drawer).
const AnalysisCtaButton = ({ date }: Props) => {
  const streaming = useDailyAnalysisStore(
    (s) => s.byDate[date]?.status === 'streaming',
  );

  function handleClick() {
    if (streaming) return;
    void drawerStore.show(AnalysisKindDrawer, { date });
  }

  return (
    <Button
      variant="bottomActionBar"
      onClick={handleClick}
      disabled={streaming}
      icon={
        streaming ? (
          <span className={styles.spinner} />
        ) : (
          <span className={styles.sparkle}>✦</span>
        )
      }
    >
      {streaming ? 'Разбираем…' : 'Анализ'}
    </Button>
  );
};

export default memo(AnalysisCtaButton);
