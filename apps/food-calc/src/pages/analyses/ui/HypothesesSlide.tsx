import { memo, useCallback, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Screen } from '@/shared/ui/Screen';
import { useAllHypotheses } from '@/entities/hypothesis';
import {
  EditHypothesisModal,
  EDIT_HYPOTHESIS_TITLE_INPUT_ID,
} from '@/features/analysis/hypothesis-drawers';
import { HypothesisWriteBar } from '@/features/analysis/HypothesisWriteBar';
import { HypothesisCard } from '@/features/analysis/AnalysisCard';
import { relativeTimeRu } from '@/shared/lib/time/relativeTimeRu';
import { pluralHypotheses } from '@/shared/lib/text/pluralHypotheses';
import { Text } from '@/shared/ui/atoms/Typography';
import { EmptyState } from '@/shared/ui/EmptyState';
import { InfoButton } from '@/shared/ui/atoms/Button';
import { drawerStore } from '@/shared/ui/drawer-store';
import { SectionInfoDrawer } from './SectionInfoDrawer';
import styles from './LabSlides.module.scss';

// Объяснялка «что такое гипотеза» за ⓘ листа — тот же ключ, что EmptyState-копирайт.
// `<em>` в строке ru.json рендерится через <Trans components>.
const hypothesesInfo = (
  <Trans i18nKey="analyses.hypotheses.info" components={{ em: <em /> }} />
);

// Слайд «Гипотезы» /analyses — то, что юзер хочет проверить. Мигрировал со
// страницы «Открытий». Свой `<Screen>` с write-bar в bottomBar (гипотезы пишутся
// от руки). Все слайды дека всегда смонтированы в Embla, поэтому черновик
// write-bar и скролл переживают переключение раздела. Edit/«Подробности» оверлеи
// портятся в #modal-by-label-root; label-focus delegation остаётся ВНУТРИ слайда.
type Props = { topSlot: ReactNode };

const HypothesesSlide = ({ topSlot }: Props) => {
  const { t } = useTranslation();
  const hypotheses = useAllHypotheses();

  // Edit modal step. label htmlFor → focus → onFocusCapture flips the step.
  const [editStep, setEditStep] = useState<'idle' | 'edit'>('idle');
  const [editingHypothesisId, setEditingHypothesisId] = useState<string | null>(null);

  // Ephemeral «new» ring, fed by the write bar's onCreated.
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());

  const topAnchorRef = useRef<HTMLDivElement>(null);
  const markNew = useCallback((id: string) => {
    setNewIds((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      topAnchorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }, []);

  const handleFocusCapture = useCallback((e: FocusEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).id === EDIT_HYPOTHESIS_TITLE_INPUT_ID) setEditStep('edit');
  }, []);

  const closeEdit = useCallback(() => {
    setEditStep('idle');
    setEditingHypothesisId(null);
  }, []);

  const openInfo = useCallback(() => {
    void drawerStore.show(SectionInfoDrawer, {
      title: t('analyses.hypotheses.title'),
      description: hypothesesInfo,
    });
  }, [t]);

  // Бар — прямо в `bottomBar` (как EventsWriteBar). Оба инсета несёт сама плашка
  // `WriteBarShell.wrap`: боковой — `--sys-inset-page`, нижний — safe-area, которую
  // `Screen.bottomBar` ей уступает по `data-edge-bleed` (канон `bottom-edge-bleed`:
  // кто красит нижнюю кромку, тот и красит системную панель PWA).
  return (
    <Screen
      stickyTop={topSlot}
      headerOverlap
      topBarHide="settings"
      topContent={
        hypotheses.length > 0 ? (
          <Text role="caption" className={styles.count}>
            {hypotheses.length} {pluralHypotheses(hypotheses.length)}
          </Text>
        ) : undefined
      }
      topContentRight={
        <InfoButton
          tone="soft"
          size={44}
          aria-label={t('analyses.hypotheses.infoAria')}
          onClick={openInfo}
        />
      }
      bottomBar={<HypothesisWriteBar onCreated={markNew} />}
    >
      <div className={styles.container} onFocusCapture={handleFocusCapture}>
        <div ref={topAnchorRef} className={styles.topAnchor} aria-hidden />

        {hypotheses.length === 0 ? (
          <EmptyState
            className={styles.empty}
            title={t('analyses.empty.hypotheses.title')}
            description={hypothesesInfo}
          />
        ) : (
          // Сохранённые гипотезы = HypothesisCard в added-режиме (шеврон-правка
          // снизу-справа), 1:1 с инсайтами. Ряд-обёртка `.hRow` несёт чёрную нижнюю
          // границу; правку открывает label htmlFor (делегирование фокуса).
          <ul className={styles.hList}>
            {hypotheses.map((h) => (
              <li key={h.id} className={styles.hRow}>
                <HypothesisCard
                  variant="added"
                  title={h.title}
                  body={h.body}
                  meta={relativeTimeRu(h.createdAt)}
                  isNew={newIds.has(h.id)}
                  onEdit={() => setEditingHypothesisId(h.id)}
                  editInputHtmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}
                />
              </li>
            ))}
          </ul>
        )}
        {/* React-child of the onFocusCapture div (portals to #modal-by-label-root),
            so the list's label-focus still bubbles here and flips the step. */}
        <EditHypothesisModal
          hypothesisId={editingHypothesisId}
          isExpanded={editStep === 'edit'}
          onClose={closeEdit}
        />
      </div>
    </Screen>
  );
};

export default memo(HypothesesSlide);
