import { memo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, type TopBarHideTarget } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import Button from '@/shared/ui/atoms/Button/Button';
import FlaskIcon from '@/shared/assets/icons/flask.svg?react';
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

// HomePage slot 0. Заголовок дня снят (2026-06-14): экран = три секции-плашки
// разбора (summary / Наблюдения / Гипотезы, см. AnalysisResult `summaryCard`) —
// БЕЛЫЕ карточки на подложке-«листе» из liquid glass (светло-серое стекло,
// Screen `.ambientSheet`). Пустой день → hollow (плашек нет, стекло гаснет,
// большой watermark-логотип). Bottom bar = two
// actions (split), unified with the Analyses page: «Мои открытия» (left →
// navigate('/discoveries'): гипотезы + инсайты) and «Анализировать» (right →
// AnalysisCtaButton: текущий день / по неделям). Weekly review is reached via
// the «По неделям» option inside the kind chooser, not a header button.
const Laboratory = ({ date, topSlot, topBarHide }: Props) => {
  const hasDaily = useDailyAnalysisStore((s) => Boolean(s.byDate[date]));
  const navigate = useNavigate();

  const actions = (
    <AppBottomBarShell side="split">
      <Button
        variant="brand"
        onClick={() => navigate('/discoveries')}
        icon={<FlaskIcon width={16} height={16} />}
      >
        Мои открытия
      </Button>
      <AnalysisCtaButton date={date} />
    </AppBottomBarShell>
  );

  // Есть разбор → кнопки уезжают В ПОТОК под результатом (`afterContent`, на
  // фоне страницы под листом, без плавающего бара/маски) — листаешь весь разбор
  // и кнопки идут следом. Пустой день → их некуда «подвесить» в потоке, поэтому
  // оставляем в плавающем нижнем баре по центру, как раньше.
  return (
    <Screen
      className={styles.ambientSheet}
      stickyTop={topSlot}
      headerOverlap
      hollow={!hasDaily}
      bottomBar={hasDaily ? undefined : actions}
      afterContent={hasDaily ? <div className={styles.flowActions}>{actions}</div> : undefined}
      topBarHide={topBarHide}
    >
      <div className={styles.container}>
        {/* Лоадер анализа (гравюрный, канон tds/art-loader-canon.md) вшит в
            DailyAnalysisSection и показывается при status==='loading'.
            Вариант анимации — DesignBar anchor 'AnalysisLoader'. */}
        <DailyAnalysisSection date={date} />
      </div>
    </Screen>
  );
};

export default memo(Laboratory);
