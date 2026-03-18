import styles from './Navigation.module.scss';
import { useParams } from 'react-router';
import { DateInfo } from './DateInfo';
import { useScreenScroll } from '@/components/features/builders/shared/ui/layout/Screen/context/ScreenScrollContext';
import { motion, useTransform } from 'framer-motion';
import WatchImage from '@/assets/decarative/watch.png';
import { getTitle } from '@/components/features/builders/ScheduleBuilder/ui/Navigation/methods';

type Props = {
  children?: React.ReactNode;
  title?: React.ReactNode;
};

const Navigation = ({ title }: Props) => {
  const params = useParams();
  const dateParam = params.id;
  const { day, monthName, monthNumber, weekdayName } = getTitle(dateParam ?? '');

  const scrollYProgress = useScreenScroll();
  const opacity = useTransform(scrollYProgress, [0.5, 0.6], [1, 0]);

  const opacityImage = useTransform(scrollYProgress, [0.5, 0.8], [0.1, 0]);

  return (
    <header className={styles.header}>
      <div className={styles.dateWords}>
        <div className={styles.dateNumbers}>
          {day}.{monthNumber}
        </div>
        <div>
          <span className={styles.dateWord}>{weekdayName}, </span>
          <span className={styles.dateWord}>{monthName}</span>
        </div>
      </div>
      <motion.img
        src={WatchImage}
        className={styles.backgroundImage}
        alt=""
        style={{ opacity: opacityImage }}
      />
      <motion.div className={styles.title} style={{ opacity }}>
        {title}
      </motion.div>
      <div className={styles.date}>
        <DateInfo scrollYProgress={scrollYProgress} />
      </div>
    </header>
  );
};

export default Navigation;
