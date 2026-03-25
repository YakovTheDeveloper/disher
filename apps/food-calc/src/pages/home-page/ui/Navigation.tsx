import styles from './Navigation.module.scss';
import { useParams } from 'react-router';
import { useScreenScroll } from '@/shared/ui/Screen/context/ScreenScrollContext';
import { useMotionValueEvent } from 'framer-motion';
import { getTitle } from '@/pages/home-page/ui/methods';
import { useState } from 'react';
import { drawerStore } from '@/shared/ui';
import { ScheduleSelectionDrawer } from '@/features/ScheduleSelection/ScheduleSelectionDrawer';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import watchSrc from '@/shared/assets/decarative/watch.png';

const Navigation = () => {
  const params = useParams();
  const dateParam = params.id;
  const { day, monthName, monthNumber, weekdayName, weekdayNameShort } = getTitle(dateParam ?? '');
  const { toScheduleBuilder } = useAppRoutes();

  const scrollYProgress = useScreenScroll();

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
      <img src={watchSrc} alt="" className={styles.watermark} />
      <div className={styles.dateLink} onClick={handleDateClick}>
        <div className={styles.masthead}>
          <span className={styles.mastheadWeekday}>{weekdayName},</span>
          <div className={styles.mastheadDateRow}>
            <span className={styles.mastheadDay}>{day}</span>
            <span className={styles.mastheadDot}>.</span>
            <span className={styles.mastheadMonthNum}>{monthNumber}</span>
            <span className={styles.mastheadMonth}>{monthName}</span>
          </div>
        </div>
        <div className={styles.mastheadCollapsed}>
          <span>
            {weekdayNameShort}, {day} {monthName}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
