import { memo, useEffect, useRef, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { AnalysisResult } from '../AnalysisResult';
import { FeatureErrorBoundary } from '@/shared/ui/error/FeatureErrorBoundary';
import { PaymentRequiredError } from '@/shared/lib/api/apiError';
import { deriveStatus, startAnalysis, useAnalysis, type Analysis } from '../api';
import { restartArgs } from './restart';
import { windowSpanDays } from './range';
import styles from './AnalysisDetailModal.module.scss';
import { Text, QuietLabel } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';

// The modal resolves with a freshly-started analysis when the user restarts a
// stale/failed run, so AnalysesPage can show the new pending row. Plain close
// resolves with undefined.
type Props = BaseModalProps<Analysis | null> & {
  /** The row tapped in the list — used as the initial seed while polling. */
  analysis: Analysis;
};

function formatRange(startIso: string, endIso: string): string {
  const s = parseISO(startIso);
  const e = parseISO(endIso);
  if (!isValid(s) || !isValid(e)) return '—';
  return `${format(s, 'd MMMM', { locale: ru })} — ${format(e, 'd MMMM yyyy', { locale: ru })}`;
}

// Detail view of one long analysis. Seeded with the list row, then kept fresh
// by useAnalysis(id) polling. A stale (hung) or failed run gets a «Запустить
// заново» action — it starts a fresh analysis over the same window and
// resolves the modal with it (TDS §edge «тап по такой строке → перезапуск»).
const AnalysisDetailModal = ({ analysis: seed, onClose }: Props) => {
  const { data } = useAnalysis(seed.id);
  const analysis = data ?? seed;
  const [restarting, setRestarting] = useState(false);

  const status = deriveStatus(analysis);
  const { appliedHypotheses } = analysis;

  // Window-aware title: a window=1 run is a single day's review, everything
  // wider is the multi-week one. Same client-side predicate as the /analyses
  // filter — the backend does not distinguish the two.
  const title =
    windowSpanDays({ start: analysis.windowStart, end: analysis.windowEnd }) === 1
      ? 'Разбор дня'
      : 'Разбор по неделям';

  // Toast once when a running analysis terminally fails (server marked it
  // failed). The in-modal banner shows it while open; the toaster persists the
  // signal briefly. Guarded so transient 5xx retries (which keep polling at
  // status 'running') never spam.
  const failToastedRef = useRef(false);
  useEffect(() => {
    if (status === 'failed' && !failToastedRef.current) {
      failToastedRef.current = true;
      toast.error('Разбор не удался — можно запустить заново');
    }
  }, [status]);

  async function handleRestart() {
    if (restarting) return;
    setRestarting(true);
    try {
      const { analysis: created } = await startAnalysis(restartArgs(analysis));
      toast.success('Разбор запущен заново');
      onClose(created);
    } catch (err) {
      console.error('restart analysis failed', err);
      toast.error(
        err instanceof PaymentRequiredError ? err.message : 'Не удалось перезапустить разбор',
      );
      setRestarting(false);
    }
  }

  return (
    <ModalLayout a11yLabel="Детали разбора">
      <ModalShell>
        <ModalShell.Header
          title={title}
          subtitle={formatRange(analysis.windowStart, analysis.windowEnd)}
          onBack={() => onClose()}
        />

      <ModalShell.Body>
        {status === 'running' && (
          <div className={styles.pending}>
            <Spinner />
            <Text as="p" role="caption" className={styles.pendingText}>
              Разбор ещё идёт — это займёт пару минут. Можно закрыть окно и
              вернуться позже.
            </Text>
          </div>
        )}

        {status === 'stale' && (
          <div className={styles.failed}>
            <Text as="p" role="label" className={styles.failedTitle}>Разбор, похоже, не удался</Text>
            <Text as="p" role="caption" className={styles.failedBody}>
              Он завис надолго без результата. Обычно это сбой на сервере —
              можно запустить его заново за то же окно.
            </Text>
          </div>
        )}

        {status === 'failed' && (
          <div className={styles.failed}>
            <Text as="p" role="label" className={styles.failedTitle}>Разбор не удался</Text>
            <Text as="p" role="caption" className={styles.failedBody}>{analysis.summary}</Text>
          </div>
        )}

        {status === 'done' && (
          <FeatureErrorBoundary label="Разбор" resetKeys={[analysis.id]}>
            <AnalysisResult
              summary={analysis.summary}
              observations={analysis.observations}
              insights={analysis.insights}
              hypotheses={analysis.hypotheses}
              insightSource="long"
              bare
            />
          </FeatureErrorBoundary>
        )}

        {(status === 'stale' || status === 'failed') && (
          <Button
            variant="accent"
            fullWidth
            disabled={restarting}
            onClick={handleRestart}
          >
            {restarting ? 'Запускаем…' : 'Запустить заново'}
          </Button>
        )}

        <section className={styles.section}>
          <QuietLabel as="p" className={styles.sectionTitle}>Гипотезы в этом разборе</QuietLabel>
          {appliedHypotheses.length === 0 ? (
            <Text as="p" role="caption" className={styles.snapshotEmpty}>
              Разбор запускался без выбранных гипотез.
            </Text>
          ) : (
            <ul className={styles.snapshotList}>
              {appliedHypotheses.map((h, idx) => (
                <li key={h.id || idx} className={styles.snapshotItem}>
                  <Text as="span" role="label" className={styles.snapshotItemTitle}>{h.title}</Text>
                  {h.body && (
                    <Text as="span" role="caption" className={styles.snapshotItemBody}>{h.body}</Text>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default memo(AnalysisDetailModal);
