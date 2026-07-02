import { memo, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, type TopBarHideTarget } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';
import ListIcon from '@/shared/assets/icons/list.svg?react';
import { AnalysisCtaButton } from '@/features/analysis/AnalysisCtaButton';
import { useDailyAnalysisStore, type DailyAnalysisReason } from '@/features/analysis/daily';
import { AnalysisResult } from '@/features/analysis/AnalysisResult';
import { FabricLoader } from '@/features/analysis/FabricLoader';
import { FeatureErrorBoundary } from '@/shared/ui/error/FeatureErrorBoundary';
import styles from './DailyAnalysis.module.scss';

type Props = {
  date: string;
  topSlot?: ReactNode;
  /** Прокидывается в `Screen` → направление-зависимое скрытие кнопок бара. */
  topBarHide?: TopBarHideTarget;
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

// HomePage slot 0. Заголовок слайда «Анализ» (Masthead) виден ВСЕГДА. Нет
// разбора → CTA «Начать» стоит в контенте, вторичная «Мои открытия» одна в
// нижнем баре. Есть разбор → CTA уезжает в конец потока (`afterContent`) рядом с
// «Мои открытия» (ведёт на /discoveries — гипотезы + инсайты).
//
// Бывший `DailyAnalysisSection` заинлайнен сюда (2026-06-27): один подписчик на
// `useDailyAnalysisStore`, одно тело разбора (streaming / done / failed /
// interrupted). Лоадер — гравюрный FabricLoader (канон tds/art-loader-canon.md).
const DailyAnalysis = ({ date, topSlot, topBarHide }: Props) => {
  const daily = useDailyAnalysisStore((s) => s.byDate[date]);
  const status = daily?.status;
  const hasDaily = Boolean(daily);
  const navigate = useNavigate();
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

  // When a run starts (fired from the bottom write-bar), reveal the section —
  // otherwise the result lands above/below the fold and the SEND reads as
  // "nothing happened". Fires once per transition into 'loading'.
  useEffect(() => {
    if (status === 'loading') {
      sectionRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [status]);

  // «Мои открытия» ведёт на /discoveries → канон-вариант `system-secondary`
  // (тихая ink-outline ссылка-кнопка с ведущей иконкой), не белая пилюля.
  const discoveriesButton = (
    <Button
      variant="system-secondary"
      icon={<ListIcon width={18} height={18} />}
      onClick={() => navigate('/discoveries')}
    >
      Мои открытия
    </Button>
  );

  return (
    <Screen
      className={styles.ambientSheet}
      stickyTop={topSlot}
      headerOverlap
      bottomBar={
        hasDaily ? undefined : (
          <AppBottomBarShell width="auto">{discoveriesButton}</AppBottomBarShell>
        )
      }
      afterContent={
        hasDaily ? (
          <div className={styles.flowActions}>
            <AppBottomBarShell side="split">
              {discoveriesButton}
              <AnalysisCtaButton date={date} />
            </AppBottomBarShell>
          </div>
        ) : undefined
      }
      topBarHide={topBarHide}
    >
      <div className={styles.container}>
        <Heading role="display" masthead as="h2">
          Анализ
        </Heading>
        {hasDaily ? (
          <section
            ref={sectionRef}
            className={styles.section}
            data-status={status}
            data-daily-analysis-anchor=""
          >
            {status === 'loading' && (
              <FabricLoader art="/art/loader-analysis.png" caption="Анализируем день" />
            )}

            {status === 'done' && daily && (
              // Заголовок «Анализ» рисует сам слайд (Masthead выше, всегда виден).
              // Здесь — только секции разбора. Под-заголовки секций ВКЛЮЧЕНЫ:
              // `.ambientSheet` переводит их в Apple «Headline» (sans, semibold).
              <FeatureErrorBoundary label="Разбор дня" resetKeys={[date]}>
                <AnalysisResult
                  summary={daily.summary}
                  summaryTitle="Анализ дня"
                  observations={daily.observations}
                  insights={daily.insights}
                  hypotheses={daily.hypotheses}
                  showDays={false}
                  bare
                />
              </FeatureErrorBoundary>
            )}

            {status === 'failed' && (
              <div className={styles.banner} data-tone="error">
                <Text as="p" role="label" className={styles.bannerTitle}>
                  Разбор не удался
                </Text>
                <Text as="p" role="caption" className={styles.bannerBody}>
                  {daily?.reason ? REASON_TEXT[daily.reason] : 'Что-то пошло не так.'}
                </Text>
                <Button
                  variant="system-secondary"
                  className={styles.bannerButton}
                  onClick={handleRetry}
                >
                  Повторить
                </Button>
              </div>
            )}

            {status === 'interrupted' && (
              <div className={styles.banner} data-tone="muted">
                <Text as="p" role="label" className={styles.bannerTitle}>
                  Разбор прерван
                </Text>
                <Text as="p" role="caption" className={styles.bannerBody}>
                  {daily?.reason ? REASON_TEXT[daily.reason] : 'Разбор не завершился.'}
                </Text>
                <Button
                  variant="system-secondary"
                  className={styles.bannerButton}
                  onClick={handleRetry}
                >
                  Запустить заново
                </Button>
              </div>
            )}
          </section>
        ) : (
          <div className={styles.startCta}>
            <AnalysisCtaButton date={date} label="Анализировать" />
          </div>
        )}
      </div>
    </Screen>
  );
};

export default memo(DailyAnalysis);
