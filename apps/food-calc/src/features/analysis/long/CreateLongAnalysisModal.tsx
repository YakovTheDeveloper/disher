import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useAllHypotheses } from '@/entities/hypothesis';
import HypothesisListPanel from '@/widgets/Laboratory/HypothesisListPanel';
import { PaymentRequiredError } from '@/shared/lib/api/apiError';
import { startAnalysis, type Analysis } from '../api';
import RangePickerWithFallback from './RangePickerWithFallback';
import {
  defaultRange,
  endsInFuture,
  isValidWindow,
  rangeDayKeys,
  type DateRange,
} from './range';
import { Button } from '@/shared/ui/atoms/Button';

// The modal resolves with the created (pending) analysis so AnalysesPage can
// show it immediately, or null/undefined if the user dismissed it.
type Props = BaseModalProps<Analysis | null>;

// «Анализ по неделям» on the AnalysesPage long-analyses slide. Picks a 7..35-day
// window (manual DD-MM-YYYY) + a set of hypotheses, POSTs to /api/analyze, and
// hands the pending row back so the list shows it as «идёт» right away. Modal
// (not drawer) since 2026-06-13 — a focused create wizard sharing the canonical
// ModalShell chrome (header + body + fixed ActionButtons) with its daily sibling
// AnalysisClarificationModal.
const CreateLongAnalysisModal = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const hypotheses = useAllHypotheses();
  const [range, setRange] = useState<DateRange>(defaultRange);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const canSubmit =
    isValidWindow(range) && !endsInFuture(range) && !submitting;

  // Snapshot of the ticked hypotheses — {id,title,body} rides into the
  // applied_hypotheses jsonb. Pruned against the live list.
  const snapshot = useMemo(
    () =>
      hypotheses
        .filter((h) => selectedIds.has(h.id))
        .map((h) => ({ id: h.id, title: h.title, body: h.body })),
    [hypotheses, selectedIds],
  );

  // The analysis id doubles as the X-Request-Id idempotency key. Mint it once
  // per attempt and REUSE it when the user resubmits after an error (the first
  // POST may have created the row + charged 5 ₽ before the response was lost —
  // reusing the id makes the retry dedup instead of double-charging). Reset it
  // whenever the inputs change, so an EDITED resubmit is a genuinely new
  // analysis with a fresh id (a reused id would dedup to the old window).
  const requestIdRef = useRef<string | null>(null);
  useEffect(() => {
    requestIdRef.current = null;
  }, [range.start, range.end, snapshot]);

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const requestId = (requestIdRef.current ??= crypto.randomUUID());
    try {
      const { analysis } = await startAnalysis({
        windowStart: range.start,
        windowEnd: range.end,
        dayKeys: rangeDayKeys(range),
        requestId,
        ...(snapshot.length > 0 ? { hypotheses: snapshot } : {}),
      });
      toast.success('Разбор запущен');
      onClose(analysis);
    } catch (err) {
      console.error('startAnalysis failed', err);
      toast.error(
        err instanceof PaymentRequiredError ? err.message : 'Не удалось запустить разбор',
      );
      setSubmitting(false);
    }
  }

  return (
    <ModalLayout a11yLabel="Новый разбор по неделям">
      <ModalShell>
        <ModalShell.Header title="Разбор по неделям" onBack={() => onClose()} />

        {/* ModalShell.Body flows as one scroller (list uses maxBodyHeight='none')
            with a --sys-stack-section gap between the window picker and the
            hypotheses — header + fixed ActionButtons stay pinned. */}
        <ModalShell.Body>
          <RangePickerWithFallback value={range} onChange={setRange} />

          {hypotheses.length === 0 ? (
            // Панель при пустом списке возвращает null (намеренно — общий
            // консумер). Здесь держим аффорданс «гипотезы опциональны».
            <EmptyState
              title={t('analyses.hypotheses.longEmpty.title')}
              description={t('analyses.hypotheses.longEmpty.description')}
            />
          ) : (
            <HypothesisListPanel
              hypotheses={hypotheses}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              titleVariant="label"
              maxBodyHeight="none"
            />
          )}

          <ModalShell.Spacer />

          <ModalShell.ActionButtons
            debugId="create-long-analysis"
            right={
              <Button
                variant="accent"
                fullWidth
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {submitting ? 'Запускаем…' : 'Запустить разбор'}
              </Button>
            }
          />
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default memo(CreateLongAnalysisModal);
