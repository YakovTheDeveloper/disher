import { memo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, type TopBarHideTarget } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { Masthead } from '@/shared/ui/atoms/Typography/Masthead';
import ListIcon from '@/shared/assets/icons/list.svg?react';
import { AnalysisCtaButton } from '@/features/analysis/AnalysisCtaButton';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import DailyAnalysisSection from './DailyAnalysisSection';
import styles from './Laboratory.module.scss';

type Props = {
  date: string;
  topSlot?: ReactNode;
  /** Прокидывается в `Screen` → направление-зависимое скрытие кнопок бара. */
  topBarHide?: TopBarHideTarget;
};

// HomePage slot 0. Заголовок слайда «Анализ» (Masthead) виден ВСЕГДА — owned
// самим слайдом, не внутренним DailyAnalysisSection. Нет разбора → CTA «Начать»
// стоит в контенте, а вторичная «Мои открытия» (ink-outline) одна в нижнем баре.
// Есть разбор → CTA уезжает в конец потока (`afterContent`) рядом с «Мои
// открытия». «Мои открытия» ведёт на /discoveries (гипотезы + инсайты).
const Laboratory = ({ date, topSlot, topBarHide }: Props) => {
  const hasDaily = useDailyAnalysisStore((s) => Boolean(s.byDate[date]));
  const navigate = useNavigate();

  const discoveriesButton = (
    <button
      type="button"
      className={styles.discoveriesBtn}
      onClick={() => navigate('/discoveries')}
    >
      <ListIcon width={18} height={18} />
      Мои открытия
    </button>
  );

  return (
    <Screen
      className={styles.ambientSheet}
      stickyTop={topSlot}
      headerOverlap
      bottomBar={hasDaily ? undefined : <AppBottomBarShell width="auto">{discoveriesButton}</AppBottomBarShell>}
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
        <Masthead as="h2">Анализ</Masthead>
        {hasDaily ? (
          /* Лоадер анализа (гравюрный, канон tds/art-loader-canon.md) вшит в
             DailyAnalysisSection и показывается при status==='loading'. */
          <DailyAnalysisSection date={date} />
        ) : (
          <div className={styles.startCta}>
            <AnalysisCtaButton date={date} label="Начать" />
          </div>
        )}
      </div>
    </Screen>
  );
};

export default memo(Laboratory);
