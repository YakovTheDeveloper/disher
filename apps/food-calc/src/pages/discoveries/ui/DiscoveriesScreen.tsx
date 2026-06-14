import { useCallback, useRef, useState, type FocusEvent } from 'react';
import clsx from 'clsx';
import { Screen } from '@/shared/ui/Screen';
import { ScreenIndicator, type ScreenEntry } from '@/shared/ui/ScreenIndicator';
import { useAllHypotheses } from '@/entities/hypothesis';
import { useAllInsights, deleteInsight } from '@/entities/insight';
import {
  EditHypothesisModal,
  EDIT_HYPOTHESIS_TITLE_INPUT_ID,
} from '@/features/analysis/hypothesis-drawers';
import { HypothesisWriteBar } from '@/features/analysis/HypothesisWriteBar';
import { InsightListPanel } from '@/features/analysis/InsightListPanel';
import HypothesisListPanel from '@/widgets/Laboratory/HypothesisListPanel';
import { pluralHypotheses } from '@/shared/lib/text/pluralHypotheses';
import { pluralInsights } from '@/shared/lib/text/pluralInsights';
import styles from './DiscoveriesScreen.module.scss';

// Stable fallbacks — the hypothesis list is read-only here (selectable=false),
// so it never selects; the panel still requires both selection props.
const EMPTY_SELECTION: Set<string> = new Set();
const noop = () => {};

type Tab = 'hypotheses' | 'insights';

// Two NavTile tabs via the canon ScreenIndicator (2 tiles → right-aligned in a
// 3-col grid, the app's standard ≤2-tile layout). bandImg off (no ghost art).
const TAB_SCREENS: ScreenEntry[] = [
  { label: 'Гипотезы' },
  { label: 'Инсайты' },
];

// The «Открытия» surface, formerly the «Гипотезы» fullscreen modal. Two tabs:
//   - Гипотезы — the user's testable notes (HypothesisWriteBar at the bottom,
//     tap a row → EditHypothesisModal via label-focus delegation);
//   - Инсайты — read-only observations saved from analysis results, deletable.
// The write-bar shows ONLY on the Гипотезы tab (insights are never authored by
// hand). Edit/«Подробности» overlays portal to #modal-by-label-root (default).
const DiscoveriesScreen = () => {
  const [tab, setTab] = useState<Tab>('hypotheses');

  const hypotheses = useAllHypotheses();
  const insights = useAllInsights();

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
    const id = (e.target as HTMLElement).id;
    if (id === EDIT_HYPOTHESIS_TITLE_INPUT_ID) setEditStep('edit');
  }, []);

  const closeEdit = useCallback(() => {
    setEditStep('idle');
    setEditingHypothesisId(null);
  }, []);

  const handleDeleteInsight = useCallback((id: string) => {
    void deleteInsight(id);
  }, []);

  const tabsNode = (
    <ScreenIndicator
      screens={TAB_SCREENS}
      activeIndex={tab === 'hypotheses' ? 0 : 1}
      onSelect={(i) => setTab(i === 0 ? 'hypotheses' : 'insights')}
      bandImg={false}
      tablistLabel="Открытия: раздел"
    />
  );

  // Write-bar belongs to the Гипотезы tab, but it stays MOUNTED (hidden via CSS
  // on the Инсайты tab) so an unsent draft + «Подробности» survive a tab switch
  // instead of being discarded by an unmount. The Screen scrim makes the focus-
  // hint readable here, so it's shown (unlike the old scrim-less modal).
  const bottomBar = (
    <div
      className={clsx(styles.writeBarDock, tab !== 'hypotheses' && styles.writeBarDockHidden)}
      aria-hidden={tab !== 'hypotheses'}
    >
      <HypothesisWriteBar onCreated={markNew} />
    </div>
  );

  return (
    <Screen stickyTop={tabsNode} headerOverlap bottomBar={bottomBar}>
      <div className={styles.container} onFocusCapture={handleFocusCapture}>
        <div ref={topAnchorRef} className={styles.topAnchor} aria-hidden />

        {tab === 'hypotheses' ? (
          <>
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
            {/* React-child of the onFocusCapture div (portals to #modal-by-label-
                root), so the list's label-focus still bubbles here and flips the step. */}
            <EditHypothesisModal
              hypothesisId={editingHypothesisId}
              isExpanded={editStep === 'edit'}
              onClose={closeEdit}
            />
          </>
        ) : (
          <>
            {insights.length > 0 && (
              <p className={styles.count}>
                {insights.length} {pluralInsights(insights.length)}
              </p>
            )}
            {insights.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyTitle}>Пока нет инсайтов</p>
                <p className={styles.emptyBody}>
                  Инсайты появляются на разборе дня или блюда — это связки и
                  предостережения по твоей еде. Нажми «Добавить к себе» на разборе,
                  и они окажутся здесь.
                </p>
              </div>
            ) : (
              <InsightListPanel insights={insights} onDelete={handleDeleteInsight} />
            )}
          </>
        )}
      </div>
    </Screen>
  );
};

export default DiscoveriesScreen;
