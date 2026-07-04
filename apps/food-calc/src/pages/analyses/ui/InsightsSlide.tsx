import { memo, useCallback, useState, type FocusEvent, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { useAllInsights, deleteInsight } from '@/entities/insight';
import { InsightListPanel } from '@/features/analysis/InsightListPanel';
import {
  EditInsightModal,
  EDIT_INSIGHT_TITLE_INPUT_ID,
} from '@/features/analysis/insight-drawers';
import { pluralInsights } from '@/shared/lib/text/pluralInsights';
import { Text } from '@/shared/ui/atoms/Typography';
import { EmptyState } from '@/shared/ui/EmptyState';
import { InfoButton } from '@/shared/ui/atoms/Button';
import { drawerStore } from '@/shared/ui/drawer-store';
import { SectionInfoDrawer } from './SectionInfoDrawer';
import styles from './LabSlides.module.scss';

// Копирайт объяснялки = тот же текст, что в EmptyState (единый источник «что это»).
const INSIGHTS_INFO =
  'Инсайты появляются на разборе дня или блюда — это связки и предостережения по твоей еде. Нажми «Сохранить» на разборе, и они окажутся здесь.';

// Слайд «Инсайты» /analyses — read-only наблюдения, сохранённые с разборов
// (deletable по long-press). Мигрировал со страницы «Открытий». Свой `<Screen>`
// БЕЗ bottomBar (инсайты не пишутся от руки).
type Props = { topSlot: ReactNode };

const InsightsSlide = ({ topSlot }: Props) => {
  const insights = useAllInsights();

  // Edit modal step. label htmlFor → focus → onFocusCapture flips the step
  // (1:1 с HypothesesSlide — правка инсайта через шеврон карточки, 2026-07-04).
  const [editStep, setEditStep] = useState<'idle' | 'edit'>('idle');
  const [editingInsightId, setEditingInsightId] = useState<string | null>(null);

  const handleDelete = useCallback((id: string) => {
    void deleteInsight(id);
  }, []);

  const handleFocusCapture = useCallback((e: FocusEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).id === EDIT_INSIGHT_TITLE_INPUT_ID) setEditStep('edit');
  }, []);

  const closeEdit = useCallback(() => {
    setEditStep('idle');
    setEditingInsightId(null);
  }, []);

  const openInfo = useCallback(() => {
    void drawerStore.show(SectionInfoDrawer, {
      title: 'Инсайты',
      description: INSIGHTS_INFO,
    });
  }, []);

  return (
    <Screen
      stickyTop={topSlot}
      headerOverlap
      topBarHide="settings"
      topContent={
        insights.length > 0 ? (
          <Text role="caption" className={styles.count}>
            {insights.length} {pluralInsights(insights.length)}
          </Text>
        ) : undefined
      }
      topContentRight={
        <InfoButton tone="ghost" size={40} aria-label="Что такое инсайты" onClick={openInfo} />
      }
    >
      <div className={styles.container} onFocusCapture={handleFocusCapture}>
        {insights.length === 0 ? (
          <EmptyState
            className={styles.empty}
            title="Пока нет инсайтов"
            description="Инсайты появляются на разборе дня или блюда — это связки и предостережения по твоей еде. Нажми «Сохранить» на разборе, и они окажутся здесь."
          />
        ) : (
          <InsightListPanel
            insights={insights}
            onDelete={handleDelete}
            onEdit={setEditingInsightId}
            editInputHtmlFor={EDIT_INSIGHT_TITLE_INPUT_ID}
          />
        )}
        {/* React-child of the onFocusCapture div (portals to #modal-by-label-root),
            so the list's label-focus still bubbles here and flips the step. */}
        <EditInsightModal
          insightId={editingInsightId}
          isExpanded={editStep === 'edit'}
          onClose={closeEdit}
        />
      </div>
    </Screen>
  );
};

export default memo(InsightsSlide);
