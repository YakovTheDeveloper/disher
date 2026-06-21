import { memo, useCallback, useRef, useState, type FocusEvent, type ReactNode } from 'react';
import { Screen } from '@/shared/ui/Screen';
import { useAllHypotheses } from '@/entities/hypothesis';
import {
  EditHypothesisModal,
  EDIT_HYPOTHESIS_TITLE_INPUT_ID,
} from '@/features/analysis/hypothesis-drawers';
import { HypothesisWriteBar } from '@/features/analysis/HypothesisWriteBar';
import HypothesisListPanel from '@/widgets/Laboratory/HypothesisListPanel';
import { pluralHypotheses } from '@/shared/lib/text/pluralHypotheses';
import styles from './DiscoveriesSlides.module.scss';

// Stable fallbacks — список read-only здесь (selectable=false), но панель всё
// равно требует оба selection-пропа.
const EMPTY_SELECTION: Set<string> = new Set();
const noop = () => {};

// Слайд «Гипотезы» — то, что юзер хочет проверить. Свой `<Screen>` с write-bar в
// bottomBar (гипотезы пишутся от руки). Оба слайда «Открытий» всегда смонтированы
// в Embla, поэтому черновик write-bar и скролл переживают переключение раздела —
// бывший CSS-hide-хак не нужен. Edit/«Подробности» оверлеи портятся в
// #modal-by-label-root; label-focus delegation остаётся ВНУТРИ этого слайда.
type Props = { topSlot: ReactNode };

const HypothesesSlide = ({ topSlot }: Props) => {
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

  return (
    <Screen
      stickyTop={topSlot}
      headerOverlap
      topBarHide="settings"
      bottomBar={
        <div className={styles.writeBarDock}>
          <HypothesisWriteBar onCreated={markNew} />
        </div>
      }
    >
      <div className={styles.container} onFocusCapture={handleFocusCapture}>
        <div ref={topAnchorRef} className={styles.topAnchor} aria-hidden />

        {hypotheses.length > 0 && (
          <p className={styles.count}>
            {hypotheses.length} {pluralHypotheses(hypotheses.length)}
          </p>
        )}
        {hypotheses.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Пока нет гипотез</p>
            <p className={styles.emptyBody}>
              Гипотеза — то, что хочешь проверить за пару недель. Например:{' '}
              <em>«Головная боль после молочки»</em>. Запиши первую в поле снизу.
            </p>
          </div>
        ) : (
          <HypothesisListPanel
            hypotheses={hypotheses}
            selectedIds={EMPTY_SELECTION}
            onToggle={noop}
            selectable={false}
            showMeta
            separated
            headerVariant="divider"
            maxBodyHeight="none"
            newIds={newIds}
            onEditHypothesis={setEditingHypothesisId}
            editInputHtmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}
          />
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
