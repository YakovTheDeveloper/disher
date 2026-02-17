import { observer } from 'mobx-react-lite';
import styles from './DateInfo.module.scss';
import { NavLink, useParams, useSearchParams } from 'react-router';
import { RouterLinks } from '@/router';
import { motion, useTransform } from 'framer-motion';
import { MotionValue } from 'framer-motion';
import { Scalable } from '@/components/ui/Scalable';
import { getTitle } from '@/components/features/builders/ScheduleBuilder/ui/Navigation/methods';
import { useDailyScheduleModals } from '@/components/features/builders/ScheduleBuilder/modalContext';
import { domainStore } from '@/store/store';
import { ScheduleDrawers } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { useModalsAndDrawers } from '@/components/features/shared/hooks/useModalsAndDrawers';
import { CSSProperties } from 'react';
import clsx from 'clsx';

type Props = {
  scrollYProgress: MotionValue<number>;
  /** CSS custom properties for theming (e.g., --di-text-night) */
  style?: CSSProperties;
  /** Additional class names for theming (e.g., 'night', 'day') */
  className?: string;
};

const DateInfo = ({ scrollYProgress, style, className }: Props) => {
  const params = useParams();
  const dateParam = params.id;
  const modals = domainStore.globalUiStore.drawerStore;

  const { day, monthName, monthNumber, weekdayName, weekdayNameShort } = getTitle(dateParam);

  const dateWordsOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const shortDayNameOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1], { clamp: true });
  const shortDayNameHeight = useTransform(scrollYProgress, [0, 0.8], ['0em', '1em'], {
    clamp: true,
  });

  const dateWordsHeight = useTransform(scrollYProgress, [0, 1], ['1.5em', '0em']);
  // const containerGap = useTransform(scrollYProgress, [0, 1], ['8px', '0px']);
  return (
    <div
      className={clsx(styles.dateLink, className)}
      style={style}
      onClick={() =>
        useModalsAndDrawers().drawerStore.open({ type: DrawerTypesV2.Schedule.DateChoose })
      }
    >
      <motion.div className={styles.date}>
        <Scalable scrollYProgress={scrollYProgress} className={styles.dateNumbers}>
          <motion.span
            className={styles.dateWord}
            style={{
              opacity: shortDayNameOpacity,
              height: shortDayNameHeight,
              overflow: 'hidden',
              willChange: 'opacity',
              transform: 'translateZ(0)',
            }}
          >
            {weekdayNameShort}
          </motion.span>

          <motion.span>
            {day}.{monthNumber}
          </motion.span>
        </Scalable>

        <motion.div
          className={styles.dateWords}
          style={{
            opacity: dateWordsOpacity,
            height: dateWordsHeight,
            overflow: 'hidden',
          }}
        >
          <span className={styles.dateWord}>{weekdayName},</span>
          <span className={styles.dateWord}>{monthName}</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default observer(DateInfo);
