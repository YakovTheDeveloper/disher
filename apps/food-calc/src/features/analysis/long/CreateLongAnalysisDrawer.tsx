import { memo, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { useAllHypotheses } from '@/entities/hypothesis';
import HypothesisListPanel from '@/widgets/Laboratory/HypothesisListPanel';
import { startAnalysis, type Analysis } from '../api';
import RangePickerWithFallback, {
  defaultRange,
  isValidWindow,
  rangeDayKeys,
  type DateRange,
} from './RangePickerWithFallback';
import styles from './CreateLongAnalysisDrawer.module.scss';

// The drawer resolves with the created (pending) analysis so AnalysesPage can
// show it immediately, or null if the user dismissed it.
type Props = BaseDrawerProps<Analysis | null>;

// «+ Анализ» on the AnalysesPage long-analyses slide. Picks a 7..35-day
// window + a set of hypotheses, POSTs to /api/analyze, and hands the pending
// row back so the list shows it as «идёт» right away.
const CreateLongAnalysisDrawer = ({ onClose }: Props) => {
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

  const validWindow = isValidWindow(range);
  const canSubmit = validWindow && !submitting;

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
      toast.error('Не удалось запустить разбор');
      setSubmitting(false);
    }
  }

  return (
    <DrawerLayout a11yLabel="Новый разбор по неделям">
      <div className={styles.body}>
        <h2 className={styles.heading}>Разбор по неделям</h2>

        <RangePickerWithFallback value={range} onChange={setRange} />

        <div className={styles.hypotheses}>
          <p className={styles.hypothesesLabel}>
            Какие гипотезы учесть в разборе
          </p>
          <HypothesisListPanel
            hypotheses={hypotheses}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            maxBodyHeight="32vh"
          />
        </div>

        <button
          type="button"
          className={styles.submit}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {submitting ? 'Запускаем…' : 'Запустить разбор'}
        </button>
      </div>
    </DrawerLayout>
  );
};

export default memo(CreateLongAnalysisDrawer);
