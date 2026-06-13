import {
  useCallback,
  useRef,
  useState,
  type FocusEvent,
} from 'react';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { useAllHypotheses } from '@/entities/hypothesis';
import {
  EditHypothesisModal,
  EDIT_HYPOTHESIS_TITLE_INPUT_ID,
} from '@/features/analysis/hypothesis-drawers';
import { HypothesisWriteBar } from '@/features/analysis/HypothesisWriteBar';
import { pluralHypotheses } from '@/shared/lib/text/pluralHypotheses';
import HypothesisListPanel from './HypothesisListPanel';
import styles from './HypothesesDrawer.module.scss';

// Stable fallbacks — the list is read-only here (selectable=false), so it never
// selects; the panel still requires both selection props.
const EMPTY_SELECTION: Set<string> = new Set();
const noop = () => {};

// The shared «Гипотезы» surface — one bottom-sheet reused by both HomePage
// (Laboratory) and the Analyses page, opened by the bottom-bar «Гипотезы»
// button on either screen (see `openHypotheses`). View-first: the list owns the
// body, adding is the pinned WriteBar in the drawer footer (canon Food/Events
// idiom), a tap on a row opens EditHypothesisModal (label htmlFor → focus →
// onFocusCapture flips the step). Replaces the former `/analyses` hypotheses
// slide + the navigate-to-slide-0 entry (2026-06-13).
//
// NOTE: the write-bar lives in the drawer footer (pinned). On-device the iOS
// keyboard can overlap a bottom-docked bar — this is the known thing to verify
// (fallback: a «+ Гипотеза» button opening a ModalByLabel composer instead).
const HypothesesDrawer = () => {
  const hypotheses = useAllHypotheses();
  const total = hypotheses.length;

  // Edit modal step. label htmlFor → focus → onFocusCapture flips the step.
  const [editStep, setEditStep] = useState<'idle' | 'edit'>('idle');
  const [editingHypothesisId, setEditingHypothesisId] = useState<string | null>(null);

  // Ephemeral «new» ring, fed by the write bar's onCreated. Clears on remount
  // (drawer reopen).
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());

  // The list is newest-first, so a just-created hypothesis lands at the TOP of
  // the drawer's scroll body. Bring the top back into view after a create so the
  // new row (and its ring) is never born above the fold.
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

  return (
    <DrawerLayout
      title="Гипотезы"
      subtitle={total > 0 ? `${total} ${pluralHypotheses(total)}` : undefined}
      a11yLabel="Гипотезы"
      modalFields
      footer={<HypothesisWriteBar onCreated={markNew} />}
    >
      {/* onFocusCapture wraps BOTH the list (labels) and EditHypothesisModal so
          the row's label-focus delegation flips the edit step — EditHypothesisModal
          portals to #modal-by-label-root but stays a React-child of this div, so
          the synthetic focus event still bubbles here. */}
      <div className={styles.body} onFocusCapture={handleFocusCapture}>
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
            headerVariant="divider"
            maxBodyHeight="none"
            newIds={newIds}
            onEditHypothesis={setEditingHypothesisId}
            editInputHtmlFor={EDIT_HYPOTHESIS_TITLE_INPUT_ID}
          />
        )}
        <EditHypothesisModal
          hypothesisId={editingHypothesisId}
          isExpanded={editStep === 'edit'}
          onClose={closeEdit}
        />
      </div>
    </DrawerLayout>
  );
};

export default HypothesesDrawer;
