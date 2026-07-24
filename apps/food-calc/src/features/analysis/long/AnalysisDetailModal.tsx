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
import LabeledCheckbox from '@/shared/ui/LabeledCheckbox/LabeledCheckbox';

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
  // Разбор дня (окно=1) — одна дата, не вырожденный диапазон «10 июня — 10 июня».
  if (windowSpanDays({ start: startIso, end: endIso }) === 1) {
    return format(s, 'd MMMM yyyy', { locale: ru });
  }
  return `${format(s, 'd MMMM', { locale: ru })} — ${format(e, 'd MMMM yyyy', { locale: ru })}`;
}

const noop = () => {};

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
      ? 'Анализ дня'
      : 'Анализ ';

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
        err instanceof PaymentRequiredError ? err.message : 'Не удалось перезапустить разбор'
      );
      setRestarting(false);
    }
  }

  return (
    <ModalLayout a11yLabel="Детали разбора">
      <ModalShell>
        <ModalShell.Header title={title} onBack={() => onClose()} />

        <ModalShell.Body>
          <Text as="p" role="caption" className={styles.dateCaption}>
            {formatRange(analysis.windowStart, analysis.windowEnd)}
          </Text>

          {status === 'running' && (
            <div className={styles.pending}>
              <Spinner />
              <Text as="p" role="caption" className={styles.pendingText}>
                Разбор ещё идёт — это займёт пару минут. Можно закрыть окно и вернуться позже.
              </Text>
            </div>
          )}

          {status === 'stale' && (
            <div className={styles.failed}>
              <Text as="p" role="label" className={styles.failedTitle}>
                Разбор, похоже, не удался
              </Text>
              <Text as="p" role="caption" className={styles.failedBody}>
                Он завис надолго без результата. Обычно это сбой на сервере — можно запустить его
                заново за то же окно.
              </Text>
            </div>
          )}

          {status === 'failed' && (
            <div className={styles.failed}>
              <Text as="p" role="label" className={styles.failedTitle}>
                Разбор не удался
              </Text>
              <Text as="p" role="caption" className={styles.failedBody}>
                {analysis.summary}
              </Text>
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
            <Button variant="accent" fullWidth disabled={restarting} onClick={handleRestart}>
              {restarting ? 'Запускаем…' : 'Запустить заново'}
            </Button>
          )}

          <section className={styles.section}>
            <QuietLabel as="p" className={styles.sectionTitle}>
              Гипотезы в этом разборе
            </QuietLabel>
            {appliedHypotheses.length === 0 ? (
              <Text as="p" role="caption" className={styles.snapshotEmpty}>
                Разбор запускался без выбранных гипотез.
              </Text>
            ) : (
              // Снимок гипотез = вдавленный well с чекбокс-рядами (визуал add-food-
              // модалки). Галочки декоративны — состояние не хранится, тоггла нет.
              <div className={styles.hypothesesWell}>
                {appliedHypotheses.map((h, idx) => (
                  <div key={h.id || idx} className={styles.hypothesisRow}>
                    <LabeledCheckbox bare checked={false} onChange={noop} label={h.title} />
                    {h.body && (
                      <Text as="p" role="caption" className={styles.hypothesisBody}>
                        {h.body}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default memo(AnalysisDetailModal);
