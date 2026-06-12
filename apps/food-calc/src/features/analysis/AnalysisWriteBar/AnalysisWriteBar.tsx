import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WriteBarShell, WriteBarMedal, WriteBarClip } from '@/shared/ui/WriteBarShell';
import { drawerStore } from '@/shared/ui';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useAllHypotheses } from '@/entities/hypothesis';
import { useScheduleFoods } from '@/entities/schedule-food';
import { useScheduleEvents } from '@/entities/schedule-event';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import { buildStartArgs } from '@/features/analysis/AnalysisClarificationModal/buildStartArgs';
import { HYPOTHESIS_COMPOSER_INPUT_ID } from '@/widgets/Laboratory/HypothesisManagerModal';
import FlaskIcon from '@/shared/assets/icons/flask.svg?react';
import { AttachHypothesesPicker } from '@/features/analysis/AttachHypothesesPicker';
import { AnalyzeButton } from './AnalyzeButton';
import { ClipMenuDrawer } from './ClipMenuDrawer';
import { ClarificationDrawer } from './ClarificationDrawer';

// Kept in sync with the backend USER_MESSAGE_MAX (see AnalysisClarificationModal).
const MESSAGE_MAX = 1000;
// WriteBarShell requires an inputId even though the field is replaced by the
// fieldOverride (AnalyzeButton) — no <input> is actually rendered.
const ANALYSIS_INPUT_ID = 'analysis-message-input';

type Props = {
  date: string;
};

/**
 * Bottom action-bar for the Analysis screen (screen 1). The inline message input
 * was removed (2026-06-12): the bar is now «скрепка + Анализировать + Мои
 * гипотезы». The primary action (run the daily analysis) is the always-present
 * center button — no longer gated behind focusing an optional field.
 *
 *  - paperclip (left)  → ClipMenuDrawer: «Гипотезы» (AttachHypothesesPicker) /
 *    «Уточнение» (ClarificationDrawer). A count badge + presence dot on the clip
 *    show what's attached.
 *  - center            → AnalyzeButton (fieldOverride): runs the analysis.
 *  - medal «Гипотезы» (right) → opens the hypothesis MANAGER (unchanged).
 *
 * SEND calls `useDailyAnalysisStore.start(date, { hypothesisIds, userMessage })`
 * — the store collects foods/events/nutrients itself. Message + attachments reset
 * on date change (the bar is always mounted).
 */
const AnalysisWriteBar = ({ date }: Props) => {
  const online = useOnline();
  const hypotheses = useAllHypotheses();
  const foods = useScheduleFoods(date) ?? [];
  const events = useScheduleEvents(date) ?? [];
  const status = useDailyAnalysisStore((st) => st.byDate[date]?.status);

  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  // Synchronous re-entry guard: start() awaits data collection before status
  // flips to 'loading', so a second tap in that window must be ignored.
  const submittingRef = useRef(false);

  // Reset bar state on date change — otherwise yesterday's attachments/message
  // silently ride into today's run (the bar is always mounted).
  useEffect(() => {
    setMessage('');
    setSelectedIds(new Set());
    submittingRef.current = false;
  }, [date]);

  const loading = status === 'loading';
  const emptyDay = foods.length === 0 && events.length === 0;
  const canRun = online && !loading && !emptyDay;
  const hasClarification = message.trim().length > 0;

  // Badge = selection ∩ live list, so a hypothesis deleted in the manager never
  // inflates the count (the SEND payload re-derives via buildStartArgs anyway).
  const attachedCount = useMemo(() => {
    if (selectedIds.size === 0) return 0;
    return hypotheses.reduce((n, h) => (selectedIds.has(h.id) ? n + 1 : n), 0);
  }, [hypotheses, selectedIds]);

  const openPicker = useCallback(() => {
    void drawerStore.show(AttachHypothesesPicker, {
      hypotheses,
      initialSelectedIds: selectedIds,
      onChange: (ids: Set<string>) => setSelectedIds(new Set(ids)),
    });
  }, [hypotheses, selectedIds]);

  const openClarification = useCallback(() => {
    void drawerStore.show(ClarificationDrawer, {
      initialValue: message,
      maxLength: MESSAGE_MAX,
      onChange: setMessage,
    });
  }, [message]);

  const openClipMenu = useCallback(() => {
    void drawerStore.show(ClipMenuDrawer, {
      hypothesesCount: attachedCount,
      hasClarification,
      onPickHypotheses: openPicker,
      onPickClarification: openClarification,
    });
  }, [attachedCount, hasClarification, openPicker, openClarification]);

  const handleAnalyze = useCallback(() => {
    if (submittingRef.current || !canRun) return;
    submittingRef.current = true;
    const args = buildStartArgs(hypotheses, selectedIds, message);
    void useDailyAnalysisStore
      .getState()
      .start(date, args)
      .finally(() => {
        submittingRef.current = false;
      });
  }, [canRun, hypotheses, selectedIds, message, date]);

  return (
    <WriteBarShell
      // Field is replaced by AnalyzeButton (fieldOverride); value/onChange/onSubmit
      // are unused but required by the shell contract. Message is edited via the
      // ClarificationDrawer, not an inline field.
      value={message}
      onChange={setMessage}
      onSubmit={() => {}}
      inputId={ANALYSIS_INPUT_ID}
      placeholder=""
      online={online}
      // No send coin — the center AnalyzeButton is the action.
      computeSend={() => ({ visible: false, enabled: false })}
      leftSlot={
        <WriteBarClip
          onClick={openClipMenu}
          ariaLabel="Добавить к разбору"
          count={attachedCount}
          dot={hasClarification}
        />
      }
      fieldOverride={
        <AnalyzeButton onClick={handleAnalyze} disabled={!canRun} busy={loading} />
      }
      rightSlot={
        <WriteBarMedal
          htmlFor={HYPOTHESIS_COMPOSER_INPUT_ID}
          ariaLabel="Мои гипотезы"
          centerNode={<FlaskIcon width={20} height={20} />}
          arcTop="мои"
          arcBottom="гипотезы"
        />
      }
    />
  );
};

export default AnalysisWriteBar;
