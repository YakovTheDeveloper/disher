import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { Heading } from '@/shared/ui/atoms/Typography';
import { useAllHypotheses } from '@/entities/hypothesis';
import HypothesisListPanel from '@/widgets/Laboratory/HypothesisListPanel';
import { PaymentRequiredError } from '@/shared/lib/api/apiError';
import { startAnalysis } from '@/features/analysis/api';
import { buildStartArgs } from './buildStartArgs';
import s from './AnalysisClarificationModal.module.scss';

// `/analyses` route path — kept as a literal so this feature does not import
// from the `app` layer (FSD upward-import boundary).
const ANALYSES_ROUTE = '/analyses';

// Free-text clamp — kept in sync with the backend (USER_MESSAGE_MAX in
// analyze.runJob.ts). The server re-clamps; this is just a UI guardrail.
const MESSAGE_MAX = 1000;

// dd-MM-yyyy (schedule day key) → yyyy-MM-dd (timezone-free, server-parseable).
// Both window endpoints get this same value, so windowSpanDays === 1 (daily).
function dayKeyToWindow(date: string): string {
  const d = parse(date, 'dd-MM-yyyy', new Date());
  return isValid(d) ? format(d, 'yyyy-MM-dd') : date;
}

// Last hypothesis selection, remembered for the session so re-opening the modal
// doesn't force re-ticking. Module-level (not persisted): resets on reload,
// which is fine — it's a within-session convenience, not stored state.
let lastSelectedIds: string[] = [];

type Props = BaseModalProps<void> & {
  /** dd-MM-yyyy — the day to analyse. */
  date: string;
};

function formatDay(date: string): string {
  const d = parse(date, 'dd-MM-yyyy', new Date());
  if (!isValid(d)) return date;
  return format(d, 'd MMMM, EEEE', { locale: ru });
}

// «Уточнение разбора» — fullscreen modal opened from AnalysisHubDrawer's
// «Разобрать день». Owns its own ephemeral selection (hypotheses) + an optional
// free-text note. «Разобрать» starts a window=1 analysis on POST /api/analyze
// (the same server route as the weekly one), then lands the user on /analyses
// where the fresh row animates «идёт» at the top of the list.
const AnalysisClarificationModal = ({ date, onClose }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hypotheses = useAllHypotheses();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(lastSelectedIds));
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Analysis id = X-Request-Id idempotency key. Reused on a resubmit after an
  // error (a lost response may hide a row that already charged 2 ₽); reset when
  // the day, hypothesis selection, or note changes so an edited run gets a fresh
  // id. See CreateLongAnalysisModal for the full rationale.
  const requestIdRef = useRef<string | null>(null);
  useEffect(() => {
    requestIdRef.current = null;
  }, [date, selectedIds, message]);

  async function handleRun() {
    if (submitting) return;
    setSubmitting(true);
    const { hypotheses: snapshot, userMessage } = buildStartArgs(
      hypotheses,
      selectedIds,
      message,
    );
    lastSelectedIds = snapshot.map((h) => h.id); // remember for the next open this session
    const window = dayKeyToWindow(date);
    const requestId = (requestIdRef.current ??= crypto.randomUUID());
    try {
      const { analysis } = await startAnalysis({
        windowStart: window,
        windowEnd: window,
        dayKeys: [date],
        requestId,
        ...(snapshot.length > 0 ? { hypotheses: snapshot } : {}),
        ...(userMessage ? { userMessage } : {}),
      });
      // Land on the list; pass the pending row so it shows «идёт» at the top
      // immediately (before the refetch lands), mirroring the weekly optimistic
      // insert. NOT auto-opening the detail modal (product decision).
      onClose();
      navigate(ANALYSES_ROUTE, { state: { justStarted: analysis } });
    } catch (err) {
      console.error('startAnalysis (daily) failed', err);
      toast.error(
        err instanceof PaymentRequiredError ? err.message : 'Не удалось запустить разбор',
      );
      setSubmitting(false);
    }
  }

  return (
    <ModalLayout a11yLabel="Уточнение разбора">
      <ModalShell variant="spring4">
        <ModalShell.Header
          title="Разбор дня"
          subtitle={formatDay(date)}
          onBack={() => onClose()}
        />
        <ModalShell.Body>
          <div className={s.block}>
            <Heading role="title">Пожелания к анализу</Heading>
            <AutoGrowSearch
              value={message}
              onChange={setMessage}
              placeholder={t('analyses.clarification.placeholder')}
              maxRows={8}
              maxLength={MESSAGE_MAX}
              collapseOnBlur={false}
            />
          </div>

          {hypotheses.length > 0 && (
            <div className={s.block}>
              <HypothesisListPanel
                hypotheses={hypotheses}
                selectedIds={selectedIds}
                onToggle={handleToggle}
                maxBodyHeight="none"
              />
            </div>
          )}

          <ModalShell.Spacer />

          <ModalShell.ActionButtons
            debugId="analysis-clarification"
            right={
              <ModalNextButton
                onClick={handleRun}
                variant="finish"
                label={submitting ? 'Запускаем…' : 'Разобрать'}
              />
            }
          />
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default memo(AnalysisClarificationModal);
