import { observer } from 'mobx-react-lite';
import styles from './DateInfo.module.scss';
import { NavLink, useParams, useSearchParams } from 'react-router';
import { RouterLinks } from '@/router';
import { motion, useTransform } from 'framer-motion';
import { MotionValue } from 'framer-motion';
import { getTitle } from '@/components/features/builders/food/ScheduleBuilder/ui/Navigation/methods';
import { useDailyScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/modalContext';
import { Modals } from '@/components/features/builders/food/ScheduleBuilder/ScheduleBuilderV2';

type Props = {
  scrollYProgress: MotionValue<number>;
};

const DateInfo = ({ scrollYProgress }: Props) => {
  const params = useParams();
  const dateParam = params.date;

  const modals = useDailyScheduleModals();

  const { day, monthName, monthNumber, weekdayName, weekdayNameShort } = getTitle(dateParam);

  const dateWordsOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const shortDayNameOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1], { clamp: true });
  const shortDayNameHeight = useTransform(scrollYProgress, [0, 0.8], ['0em', '1em'], {
    clamp: true,
  });

  const dateWordsHeight = useTransform(scrollYProgress, [0, 1], ['1.5em', '0em']);
  // const containerGap = useTransform(scrollYProgress, [0, 1], ['8px', '0px']);
  const numbersScale = useTransform(scrollYProgress, [0.5, 1], [2, 1]);

  const dateBackgroundColor = useTransform(scrollYProgress, (v) =>
    v >= 0.999 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0)'
  );

  const blur = useTransform(scrollYProgress, (v) => (v >= 0.999 ? 'blur(30px)' : 'none'));

  // const dateBackgroundColor = useTransform(
  //   scrollYProgress,
  //   [0, 0.999999, 1],
  //   ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.8)']
  // );
  return (
    <div className={styles.dateLink} onClick={() => modals.set(Modals.DateChoose)}>
      <motion.div className={styles.date}>
        <motion.div
          className={styles.dateNumbers}
          style={{
            scale: numbersScale,
            backgroundColor: dateBackgroundColor,
            backdropFilter: blur,
          }}
        >
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
        </motion.div>

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
