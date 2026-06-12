import {
  memo,
  useCallback,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { Screen } from '@/shared/ui/Screen';
import { useAllHypotheses } from '@/entities/hypothesis';
import {
  EditHypothesisModal,
  EDIT_HYPOTHESIS_TITLE_INPUT_ID,
} from '@/features/analysis/hypothesis-drawers';
import { HypothesisWriteBar } from '@/features/analysis/HypothesisWriteBar';
import HypothesisListPanel from '@/widgets/Laboratory/HypothesisListPanel';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { pluralHypotheses } from '@/shared/lib/text/pluralHypotheses';
import styles from './HypothesesSlide.module.scss';

// Stable fallbacks — the list is read-only here (selectable=false), so it never
// selects; the panel still requires both selection props.
const EMPTY_SELECTION: Set<string> = new Set();
const noop = () => {};

type Props = {
  topBar: ReactNode;
};

// AnalysesPage slide 0 — view-first hypotheses screen. The list owns the body;
// adding is a bottom WriteBar (canon Food/Events idiom). A tap on a row opens
// EditHypothesisModal (label htmlFor → focus → onFocusCapture flips the step).
const HypothesesSlide = ({ topBar }: Props) => {
  const hypotheses = useAllHypotheses();
  const total = hypotheses.length;

  // Edit modal step. label htmlFor → focus → onFocusCapture flips the step.
  const [editStep, setEditStep] = useState<'idle' | 'edit'>('idle');
  const [editingHypothesisId, setEditingHypothesisId] = useState<string | null>(null);

  // Ephemeral «new» ring — owned here (moved off the deleted HypothesisSection),
  // fed by the write bar's onCreated. Clears on remount (reload / leaving).
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());

  // The list is newest-first, so a just-created hypothesis lands at the TOP.
  // If the user had scrolled the Screen down, that new row (and its ring) would
  // be created above the fold and never seen. After a create, bring the top of
  // the content back into view (the Screen owns the single scroll container;
  // the write bar lives outside it, so we scroll a top sentinel into view).
  const topAnchorRef = useRef<HTMLDivElement>(null);
  const markNew = useCallback((id: string) => {
    setNewIds((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      topAnchorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }, []);

  const handleFocusCapture = useCallback((e: FocusEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).id;
    if (id === EDIT_HYPOTHESIS_TITLE_INPUT_ID) setEditStep('edit');
  }, []);

  const closeEdit = useCallback(() => {
    setEditStep('idle');
    setEditingHypothesisId(null);
  }, []);

  const header = (
    <div className={styles.header}>
      <Heading size="section">Гипотезы</Heading>
      {total > 0 && (
        <span className={styles.count}>
          {total} {pluralHypotheses(total)}
        </span>
      )}
    </div>
  );

  return (
    <div onFocusCapture={handleFocusCapture}>
      <Screen
        stickyTop={topBar}
        headerOverlap
        contentHeader={header}
        bottomBar={<HypothesisWriteBar onCreated={markNew} />}
      >
        <div className={styles.container}>
          <div ref={topAnchorRef} className={styles.topAnchor} aria-hidden />
          {total === 0 ? (
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
              newIds={newIds}
              maxBodyHeight="none"
              onEditHypothesis={setEditingHypothesisId}
              editInputHtmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}
            />
          )}
        </div>
      </Screen>
      <EditHypothesisModal
        hypothesisId={editingHypothesisId}
        isExpanded={editStep === 'edit'}
        onClose={closeEdit}
      />
    </div>
  );
};

export default memo(HypothesesSlide);
