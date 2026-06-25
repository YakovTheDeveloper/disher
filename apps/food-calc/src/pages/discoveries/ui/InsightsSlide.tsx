import { memo, useCallback, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { useAllInsights, deleteInsight } from '@/entities/insight';
import { InsightListPanel } from '@/features/analysis/InsightListPanel';
import { pluralInsights } from '@/shared/lib/text/pluralInsights';
import { Text, Heading } from '@/shared/ui/atoms/Typography';
import styles from './DiscoveriesSlides.module.scss';

// Слайд «Инсайты» — read-only наблюдения, сохранённые с разборов (deletable).
// Свой `<Screen>` БЕЗ bottomBar (инсайты не пишутся от руки).
type Props = { topSlot: ReactNode };

const InsightsSlide = ({ topSlot }: Props) => {
  const insights = useAllInsights();

  const handleDelete = useCallback((id: string) => {
    void deleteInsight(id);
  }, []);

  return (
    <Screen stickyTop={topSlot} headerOverlap topBarHide="settings">
      <div className={styles.container}>
        {insights.length > 0 && (
          <Text role="caption" className={styles.count}>
            {insights.length} {pluralInsights(insights.length)}
          </Text>
        )}
        {insights.length === 0 ? (
          <div className={styles.empty}>
            <Heading as="h3" role="title" className={styles.emptyTitle}>
              Пока нет инсайтов
            </Heading>
            <Text as="p" role="caption" className={styles.emptyBody}>
              Инсайты появляются на разборе дня или блюда — это связки и
              предостережения по твоей еде. Нажми «Добавить к себе» на разборе, и
              они окажутся здесь.
            </Text>
          </div>
        ) : (
          <InsightListPanel insights={insights} onDelete={handleDelete} />
        )}
      </div>
    </Screen>
  );
};

export default memo(InsightsSlide);
