import { memo, useCallback, useEffect, useRef } from 'react';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import { AnalysisResult } from '@/features/analysis/AnalysisResult';
import { FabricLoader } from '@/features/analysis/FabricLoader';
import { Masthead } from '@/shared/ui/atoms/Typography/Masthead';
import type { DailyAnalysisReason } from '@/features/analysis/daily';
import styles from './DailyAnalysisSection.module.scss';

type Props = {
  date: string;
};

// Subtitle text per failure/interrupt reason — the discriminator that makes
// «не удался» (system fault) read differently from «прерван» (consequence of
// the user's own action).
const REASON_TEXT: Record<NonNullable<DailyAnalysisReason>, string> = {
  network: 'Похоже, пропала сеть.',
  server: 'Что-то пошло не так на сервере.',
  payment: 'Недостаточно средств — пополните баланс.',
  reload: 'Страница перезагрузилась во время разбора.',
  'date-switch': 'Ты переключился на другую дату.',
};

// Inline daily-analysis surface under the hypothesis list. One record per
// date (idb-keyval): streaming / done / failed / interrupted, plus the
// idle invitation when the day has never been analysed.
const DailyAnalysisSection = ({ date }: Props) => {
  const daily = useDailyAnalysisStore((s) => s.byDate[date]);
  const status = daily?.status;
  const sectionRef = useRef<HTMLElement | null>(null);

  // Re-run uses the snapshot's hypothesis ids — the same hypotheses the
  // failed/interrupted run was started with (re-snapshotted from Dexie).
  const handleRetry = useCallback(() => {
    if (!daily) return;
    void useDailyAnalysisStore.getState().start(date, {
      hypothesisIds: daily.appliedHypotheses.map((h) => h.id),
      userMessage: daily.appliedUserMessage,
    });
  }, [date, daily]);

  // When a run starts (fired from the bottom write-bar), reveal this section —
  // otherwise the result lands above/below the fold and the SEND reads as
  // "nothing happened". Fires once per transition into 'loading'.
  useEffect(() => {
    if (status === 'loading') {
      sectionRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [status]);

  // Нет разбора за день — ничего не показываем (решение 2026-06-08: убрали
  // подсказку «Разбор дня»; CTA «Разбор» в нижнем баре самоочевиден).
  if (!daily) return null;

  const { summary, observations, insights, hypotheses, reason } = daily;

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      data-status={status}
      data-daily-analysis-anchor=""
    >
      {status === 'loading' && (
        <FabricLoader art="/art/loader-analysis.png" caption="Анализируем день" />
      )}

      {status === 'done' && (
        <>
          {/* «Анализ» — Apple Large Title + тающая бровка, общий атом
              `Masthead` (тот же голос на слайдах Еда/События HomePage). */}
          <Masthead as="h2">Анализ</Masthead>
          {/* Под-заголовки секций (Наблюдения / Инсайты / Гипотезы) ВКЛЮЧЕНЫ —
              Apple-grouped иерархия: типографика несёт структуру. `.ambientSheet`
              переводит их в Apple «Headline» (sans, semibold, слева). */}
          <AnalysisResult
            summary={summary}
            observations={observations}
            insights={insights}
            hypotheses={hypotheses}
            showDays={false}
            bare
          />
        </>
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
    </section>
  );
};

export default memo(DailyAnalysisSection);
