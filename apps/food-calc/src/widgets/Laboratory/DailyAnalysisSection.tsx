import { memo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import { IdeaCard } from '@/features/analysis/IdeaCard';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import type { DailyAnalysisReason } from '@/features/analysis/daily';
import styles from './DailyAnalysisSection.module.scss';

const SURFACE_VARIANTS = ['card', 'flat'] as const;

type Props = {
  date: string;
};

// Subtitle text per failure/interrupt reason — the discriminator that makes
// «не удался» (system fault) read differently from «прерван» (consequence of
// the user's own action).
const REASON_TEXT: Record<NonNullable<DailyAnalysisReason>, string> = {
  network: 'Похоже, пропала сеть.',
  server: 'Что-то пошло не так на сервере.',
  reload: 'Страница перезагрузилась во время разбора.',
  'date-switch': 'Ты переключился на другую дату.',
};

// Inline daily-analysis surface under the hypothesis list. One record per
// date (idb-keyval): streaming / done / failed / interrupted, plus the
// idle invitation when the day has never been analysed.
const DailyAnalysisSection = ({ date }: Props) => {
  const daily = useDailyAnalysisStore((s) => s.byDate[date]);
  const hydrated = useDailyAnalysisStore((s) => s.hydrated);
  const { anchor } = useDesignVariant('DailyAnalysis', SURFACE_VARIANTS);

  // Re-run uses the snapshot's hypothesis ids — the same hypotheses the
  // failed/interrupted run was started with (re-snapshotted from Dexie).
  const handleRetry = useCallback(() => {
    if (!daily) return;
    void useDailyAnalysisStore.getState().start(date, {
      hypothesisIds: daily.appliedHypotheses.map((h) => h.id),
    });
  }, [date, daily]);

  if (!daily) {
    // Before the idb-keyval boot read finishes, `byDate` is empty — render
    // nothing rather than flashing the invitation over a result that is
    // about to hydrate in.
    if (!hydrated) return null;
    return (
      <section className={styles.invite} {...anchor}>
        <p className={styles.inviteTitle}>Разбор дня</p>
        <p className={styles.inviteBody}>
          Запусти разбор — ИИ посмотрит, что ты ел и как себя чувствовал за
          день, и подскажет, на что обратить внимание.
        </p>
      </section>
    );
  }

  const { status, resultMd, ideaCards, reason } = daily;

  return (
    <section className={styles.section} {...anchor} data-status={status}>
      {status === 'streaming' && (
        <div className={styles.statusRow}>
          <Spinner />
          <span className={styles.statusText}>Разбираем день…</span>
        </div>
      )}

      {resultMd && (
        <div className={styles.markdown}>
          <ReactMarkdown>{resultMd}</ReactMarkdown>
        </div>
      )}

      {status === 'failed' && (
        <div className={styles.banner} data-tone="error">
          <p className={styles.bannerTitle}>Разбор не удался</p>
          <p className={styles.bannerBody}>
            {reason ? REASON_TEXT[reason] : 'Что-то пошло не так.'}
          </p>
          <button
            type="button"
            className={styles.bannerButton}
            onClick={handleRetry}
          >
            Повторить
          </button>
        </div>
      )}

      {status === 'interrupted' && (
        <div className={styles.banner} data-tone="muted">
          <p className={styles.bannerTitle}>Разбор прерван</p>
          <p className={styles.bannerBody}>
            {reason ? REASON_TEXT[reason] : 'Разбор не завершился.'}
          </p>
          <button
            type="button"
            className={styles.bannerButton}
            onClick={handleRetry}
          >
            Запустить заново
          </button>
        </div>
      )}

      {status === 'done' && ideaCards.length > 0 && (
        <div className={styles.ideas}>
          <p className={styles.ideasTitle}>Идеи для эксперимента</p>
          <div className={styles.ideasList}>
            {ideaCards.map((idea, idx) => (
              <IdeaCard key={idx} idea={idea} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default memo(DailyAnalysisSection);
