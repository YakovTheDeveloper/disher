import { memo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { AnalysisResult } from '../AnalysisResult';
import { PaymentRequiredError } from '@/shared/lib/api/apiError';
import { deriveStatus, startAnalysis, useAnalysis, type Analysis } from '../api';
import { restartArgs } from './restart';
import styles from './AnalysisDetailModal.module.scss';

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
    <ModalLayout className={styles.layout} a11yLabel="Детали разбора">
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Разбор по неделям</h2>
          <p className={styles.range}>
            {formatRange(analysis.windowStart, analysis.windowEnd)}
          </p>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => onClose()}
          aria-label="Закрыть"
        >
          ×
        </button>
      </header>

      <div className={styles.body}>
        {status === 'running' && (
          <div className={styles.pending}>
            <Spinner />
            <p className={styles.pendingText}>
              Разбор ещё идёт — это займёт пару минут. Можно закрыть окно и
              вернуться позже.
            </p>
          </div>
        )}

        {status === 'stale' && (
          <div className={styles.failed}>
            <p className={styles.failedTitle}>Разбор, похоже, не удался</p>
            <p className={styles.failedBody}>
              Он завис надолго без результата. Обычно это сбой на сервере —
              можно запустить его заново за то же окно.
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className={styles.failed}>
            <p className={styles.failedTitle}>Разбор не удался</p>
            <p className={styles.failedBody}>{analysis.summary}</p>
          </div>
        )}

        {status === 'done' && (
          <AnalysisResult
            summary={analysis.summary}
            insights={analysis.insights}
            hypotheses={analysis.hypotheses}
            insightSource="long"
            bare
          />
        )}

        {(status === 'stale' || status === 'failed') && (
          <button
            type="button"
            className={styles.restart}
            disabled={restarting}
            onClick={handleRestart}
          >
            {restarting ? 'Запускаем…' : 'Запустить заново'}
          </button>
        )}

        <section className={styles.section}>
          <p className={styles.sectionTitle}>Гипотезы в этом разборе</p>
          {appliedHypotheses.length === 0 ? (
            <p className={styles.snapshotEmpty}>
              Разбор запускался без выбранных гипотез.
            </p>
          ) : (
            <ul className={styles.snapshotList}>
              {appliedHypotheses.map((h, idx) => (
                <li key={h.id || idx} className={styles.snapshotItem}>
                  <span className={styles.snapshotItemTitle}>{h.title}</span>
                  {h.body && (
                    <span className={styles.snapshotItemBody}>{h.body}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ModalLayout>
  );
};

export default memo(AnalysisDetailModal);
