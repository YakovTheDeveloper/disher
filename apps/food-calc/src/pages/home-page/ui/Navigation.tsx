import styles from './Navigation.module.scss';
import { useParams } from 'react-router';
import { useScreenScroll } from '@/shared/ui/Screen/context/ScreenScrollContext';
import { motion, useTransform, useMotionValueEvent } from 'framer-motion';
import WatchImage from '@/shared/assets/decarative/watch.png';
import { getTitle } from '@/pages/home-page/ui/methods';
import { useState } from 'react';
import { drawerStore } from '@/shared/ui';
import { ScheduleSelectionDrawer } from '@/features/ScheduleSelection/ScheduleSelectionDrawer';
import { useAppRoutes } from '@/app/routing/useAppRoutes';

type Props = {
  children?: React.ReactNode;
  title?: React.ReactNode;
};

const Navigation = ({ title }: Props) => {
  const params = useParams();
  const dateParam = params.id;
  const { day, monthName, monthNumber, weekdayName, weekdayNameShort } = getTitle(dateParam ?? '');
  const { toScheduleBuilder } = useAppRoutes();

  const scrollYProgress = useScreenScroll();
  // const opacityImage = useTransform(scrollYProgress, [0.5, 0.8], [0.1, 0]);

  const [collapsed, setCollapsed] = useState(false);
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setCollapsed(value >= 0.5);
  });

  const handleDateClick = async () => {
    const selectedDate = await drawerStore.show(ScheduleSelectionDrawer, {
      selectedDate: dateParam,
    });
    if (selectedDate) {
      toScheduleBuilder(selectedDate);
    }
  };

  return (
    <header className={styles.header} data-collapsed={collapsed}>
      <section className={styles.row}>
        <div className={styles.left}>
          <motion.img src={WatchImage} className={styles.backgroundImage} alt="" />
          <div className={styles.title}>{title}</div>
        </div>
        <div className={styles.dateLink} onClick={handleDateClick}>
          <div className={styles.date}>
            <div className={styles.dateNumbers}>
              <span className={styles.weekdayShort}>{weekdayNameShort}</span>
              <span>
                {day}.{monthNumber}
              </span>
            </div>
            <div className={styles.dateWords}>
              <span className={styles.dateWord}>{weekdayName},</span>
              <span className={styles.dateWord}>{monthName}</span>
            </div>
          </div>
        </div>
      </section>
    </header>
  );
};

export default Navigation;
