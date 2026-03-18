import { observer } from 'mobx-react-lite';
import { ReactNode, useMemo } from 'react';
import { ColumnLayoutWithFixedHeader } from '@/components/ui/ColumnLayoutWithFixedHeader/index';
import styles from './ScheduleFoodCommonForm.module.scss';
import { DateInfo } from '@/components/features/builders/ScheduleBuilder/ui/Navigation/DateInfo';
import { MotionValue, useMotionValue } from 'framer-motion';
import { getTimeOfDay, TimeOfDay } from '@/lib/time/getTimeOfDay';

const TIME_OF_DAY_BG: Record<TimeOfDay, string> = {
  morning: 'linear-gradient(135deg, #fdf6e3 0%, #faeec8 100%)',
  day: 'linear-gradient(135deg, #e8e0f0 0%, #d4c8e8 100%)',
  evening: 'linear-gradient(135deg, #fce4d6 0%, #f5c9b3 100%)',
  night: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)',
};

/** Цвет текста для даты (DateInfo) каждого времени суток */
export const TIME_OF_DAY_TEXT: Record<TimeOfDay, string> = {
  morning: 'rgb(80, 60, 20)',
  day: 'rgb(47, 38, 72)',
  evening: 'rgb(100, 50, 30)',
  night: 'rgb(200, 190, 220)', // Светло-лавандовый для тёмного фиолетового фона
};

/** Комплементарные градиенты для заголовка (HeaderGradientConfig) */
export const TIME_OF_DAY_HEADER_GRADIENT: Record<TimeOfDay, { initial: string; finished: string }> =
  {
    morning: {
      initial:
        'linear-gradient(to bottom, rgba(255, 248, 220, 0) 0%, rgba(255, 248, 220, 0) 70%, rgba(255, 248, 220, 0) 100%)',
      finished:
        'linear-gradient(to bottom, rgba(255, 248, 220, 0) 0%, rgba(255, 200, 100, 0.3) 70%, rgba(255, 180, 50, 0.5) 100%)',
    },
    day: {
      initial:
        'linear-gradient(to bottom, rgba(232, 224, 240, 0) 0%, rgba(232, 224, 240, 0) 70%, rgba(232, 224, 240, 0) 100%)',
      finished:
        'linear-gradient(to bottom, rgba(232, 224, 240, 0) 0%, rgba(180, 140, 220, 0.3) 70%, rgba(150, 100, 200, 0.5) 100%)',
    },
    evening: {
      initial:
        'linear-gradient(to bottom, rgba(252, 228, 214, 0) 0%, rgba(252, 228, 214, 0) 70%, rgba(252, 228, 214, 0) 100%)',
      finished:
        'linear-gradient(to bottom, rgba(252, 228, 214, 0) 0%, rgba(255, 160, 100, 0.3) 70%, rgba(255, 120, 50, 0.5) 100%)',
    },
    night: {
      initial:
        'linear-gradient(to bottom, rgba(26, 10, 46, 0) 0%, rgba(26, 10, 46, 0) 70%, rgba(26, 10, 46, 0) 100%)',
      finished:
        'linear-gradient(to bottom, rgba(26, 10, 46, 0) 0%, rgba(80, 40, 120, 0.4) 70%, rgba(100, 50, 150, 0.6) 100%)',
    },
  };

// ============================================
// V2: Холодные оттенки (для гармонии с rgb(224, 229, 246) → rgb(235, 242, 250))
// ============================================

/** Фоновые градиенты V2 - яркие холодные оттенки */
export const TIME_OF_DAY_BG_V2: Record<TimeOfDay, string> = {
  morning:
    'linear-gradient(135deg, rgb(80, 67, 67) 0%, rgb(45, 54, 55) 70%, rgbrgb(98, 110, 110)0%)',
  day: 'linear-gradient(135deg, rgb(190, 210, 255) 0%, rgb(210, 225, 255) 70%, rgb(249, 255, 255) 100%)',
  evening:
    'linear-gradient(135deg, rgb(235, 210, 255) 0%, rgb(255, 235, 255) 70%, rgb(249, 255, 255) 100%)',
  night:
    'linear-gradient(135deg, rgb(25, 35, 70) 0%, rgb(45, 55, 95) 70%, rgb(249, 255, 255) 100%)',
};

/** Цвет текста V2 - яркие холодные оттенки */
export const TIME_OF_DAY_TEXT_V2: Record<TimeOfDay, string> = {
  morning: 'rgb(20, 60, 80)',
  day: 'rgb(30, 40, 90)',
  evening: 'rgb(70, 25, 75)',
  night: 'rgb(200, 210, 255)',
};

/** Градиенты заголовка V2 - яркие холодные оттенки */
export const TIME_OF_DAY_HEADER_GRADIENT_V2: Record<
  TimeOfDay,
  { initial: string; finished: string }
> = {
  morning: {
    initial:
      'linear-gradient(to bottom, rgba(215, 230, 245, 0) 0%, rgba(215, 230, 245, 0) 70%, rgba(215, 230, 245, 0) 100%)',
    finished:
      'linear-gradient(to bottom, rgba(215, 230, 245, 0) 0%, rgba(255, 255, 255, 0.45) 70%, rgba(177, 46, 129, 0.65) 100%)',
  },
  day: {
    initial:
      'linear-gradient(to bottom, rgba(220, 228, 245, 0) 0%, rgba(220, 228, 245, 0) 70%, rgba(220, 228, 245, 0) 100%)',
    finished:
      'linear-gradient(to bottom, rgba(220, 228, 245, 0) 0%, rgba(200, 215, 242, 0.4) 70%, rgba(185, 205, 238, 0.6) 100%)',
  },
  evening: {
    initial:
      'linear-gradient(to bottom, rgba(218, 220, 242, 0) 0%, rgba(218, 220, 242, 0) 70%, rgba(218, 220, 242, 0) 100%)',
    finished:
      'linear-gradient(to bottom, rgba(218, 220, 242, 0) 0%, rgba(195, 200, 235, 0.45) 70%, rgba(178, 185, 228, 0.65) 100%)',
  },
  night: {
    initial:
      'linear-gradient(to bottom, rgba(25, 35, 70, 0) 0%, rgba(25, 35, 70, 0) 70%, rgba(25, 35, 70, 0) 100%)',
    finished:
      'linear-gradient(to bottom, rgba(25, 35, 70, 0) 0%, rgba(80, 100, 180, 0.5) 70%, rgba(100, 130, 220, 0.7) 100%)',
  },
};

type Props = {
  /** Время в формате HH:mm */
  time: string;
  /** Основной контент */
  children: ReactNode;
  /** Кнопка для футера */
  button: ReactNode;
};

const ScheduleFoodCommonForm = ({ time, children, button }: Props) => {
  log(time);
  const motionValue: MotionValue<number> = useMotionValue(0); // Здесь нужно передать реальное значение scrollYProgress

  // Определяем время суток на основе переданного времени
  const timeOfDay = getTimeOfDay(time);

  // Мемоизируем объект стилей для DateInfo
  const dateInfoStyles = useMemo(
    () =>
      ({
        '--di-text-default': 'white',
        '--di-word-default': 'white',
      }) as React.CSSProperties,
    [timeOfDay]
  );

  const layoutContainerBgStyle = useMemo(
    () =>
      ({
        '--clfh-bg-default': 'rgba(10, 25, 81, 0.89)',
      }) as React.CSSProperties,
    [timeOfDay]
  );

  const headerGradient = useMemo(() => TIME_OF_DAY_HEADER_GRADIENT_V2[timeOfDay], [timeOfDay]);

  return (
    <ColumnLayoutWithFixedHeader
      id="schedule-item-form"
      headerClassName={styles.header}
      containerClassName={styles.container}
      contentClassName={styles.content}
      containerStyle={layoutContainerBgStyle}
      headerGradient={headerGradient}
      header={
        <DateInfo scrollYProgress={motionValue} className={timeOfDay} style={dateInfoStyles} />
      }
    >
      {children}
      <div className={styles.footer}>{button}</div>
    </ColumnLayoutWithFixedHeader>
  );
};
export default observer(ScheduleFoodCommonForm);
