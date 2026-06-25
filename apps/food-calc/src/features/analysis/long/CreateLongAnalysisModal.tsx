import { memo, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import CloseButton from '@/shared/ui/atoms/Button/CloseButton/CloseButton';
import { FieldLabel } from '@/shared/ui/atoms/Typography/FieldLabel';
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
import styles from './CreateLongAnalysisModal.module.scss';
import { Heading, Text } from '@/shared/ui/atoms/Typography';

// The modal resolves with the created (pending) analysis so AnalysesPage can
// show it immediately, or null/undefined if the user dismissed it.
type Props = BaseModalProps<Analysis | null>;

// «Анализ по неделям» on the AnalysesPage long-analyses slide. Picks a 7..35-day
// window (manual DD-MM-YYYY) + a set of hypotheses, POSTs to /api/analyze, and
// hands the pending row back so the list shows it as «идёт» right away. Modal
// (not drawer) since 2026-06-13 — a focused create wizard, sharing the detail
// modal's header chrome.
const CreateLongAnalysisModal = ({ onClose }: Props) => {
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

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { analysis } = await startAnalysis({
        windowStart: range.start,
        windowEnd: range.end,
        dayKeys: rangeDayKeys(range),
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
    <ModalLayout className={styles.layout} a11yLabel="Новый разбор по неделям">
      <div className={styles.shell}>
        <header className={styles.header}>
          <Heading role="title" className={styles.title}>Разбор по неделям</Heading>
          <CloseButton onClick={() => onClose()} />
        </header>

        {/* Single scroll container — the list flows (maxBodyHeight='none') so the
            whole middle scrolls as one, header + footer stay pinned. */}
        <div className={styles.scrollArea}>
          <RangePickerWithFallback value={range} onChange={setRange} />

          {hypotheses.length === 0 ? (
            // Панель при пустом списке возвращает null (намеренно — общий
            // консумер). Здесь держим аффорданс «гипотезы опциональны».
            <div className={styles.hypothesesEmpty}>
              <FieldLabel>Гипотезы</FieldLabel>
              <Text as="p" role="caption" className={styles.hypothesesEmptyHint}>
                Гипотез пока нет — разбор можно запустить и без них.
              </Text>
            </div>
          ) : (
            <HypothesisListPanel
              hypotheses={hypotheses}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              titleVariant="label"
              maxBodyHeight="none"
            />
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.submit}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <Text role="label" as="span">
              {submitting ? 'Запускаем…' : 'Запустить разбор'}
            </Text>
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

export default memo(CreateLongAnalysisModal);
