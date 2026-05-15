import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { IdeaCard } from '../IdeaCard';
import { isFailedAnalysis, isPendingAnalysis, useAnalysis, type Analysis } from '../api';
import styles from './AnalysisDetailModal.module.scss';

type Props = BaseModalProps<void> & {
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
// by useAnalysis(id) polling — a row opened while still «идёт» flips to the
// result in place. Renders the markdown + idea cards + a read-only snapshot
// of the hypotheses the user ticked when the job was started.
const AnalysisDetailModal = ({ analysis: seed, onClose }: Props) => {
  const { data } = useAnalysis(seed.id);
  const analysis = data ?? seed;

  const pending = isPendingAnalysis(analysis);
  const failed = isFailedAnalysis(analysis);
  const { appliedHypotheses, ideaCards } = analysis;

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
        {pending && (
          <div className={styles.pending}>
            <Spinner />
            <p className={styles.pendingText}>
              Разбор ещё идёт — это займёт пару минут. Можно закрыть окно и
              вернуться позже.
            </p>
          </div>
        )}

        {!pending && failed && (
          <div className={styles.failed}>
            <p className={styles.failedTitle}>Разбор не удался</p>
            <p className={styles.failedBody}>{analysis.resultMd}</p>
          </div>
        )}

        {!pending && !failed && (
          <div className={styles.markdown}>
            <ReactMarkdown>{analysis.resultMd}</ReactMarkdown>
          </div>
        )}

        {!pending && !failed && ideaCards.length > 0 && (
          <section className={styles.section}>
            <p className={styles.sectionTitle}>Идеи для эксперимента</p>
            <div className={styles.ideas}>
              {ideaCards.map((idea, idx) => (
                <IdeaCard key={idx} idea={idea} />
              ))}
            </div>
          </section>
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
