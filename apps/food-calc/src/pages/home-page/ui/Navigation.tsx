import styles from './Navigation.module.scss';
import { useParams } from 'react-router';
import { getTitle } from '@/pages/home-page/ui/methods';
import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { drawerStore } from '@/shared/ui';
import { ScheduleSelectionDrawer } from '@/features/ScheduleSelection/ScheduleSelectionDrawer';
import { useAppRoutes } from '@/app/routing/useAppRoutes';

const Navigation = () => {
  const params = useParams();
  const dateParam = params.id;
  const { day, monthName, monthNumber, weekdayName, weekdayNameShort } = getTitle(dateParam ?? '');
  const { toScheduleBuilder } = useAppRoutes();

  const mastheadRef = useRef<HTMLDivElement>(null);
  const [showMini, setShowMini] = useState(false);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const el = mastheadRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setShowMini(!entry.isIntersecting), {
      threshold: 0.5,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleDateClick = useCallback(async () => {
    setLifted(true);
    await new Promise((resolve) => setTimeout(resolve, 220));
    setLifted(false);
    const selectedDate = await drawerStore.show(ScheduleSelectionDrawer, {
      selectedDate: dateParam,
    });
    if (selectedDate) {
      toScheduleBuilder(selectedDate);
    }
  }, [dateParam, toScheduleBuilder]);

  const dayPadded = String(day).padStart(2, '0');

  return (
    <>
      <header className={styles.header}>
        <div className={styles.dateLink} onClick={handleDateClick} ref={mastheadRef}>
          <div className={styles.v3}>
            <span className={`${styles.v3Day} ${lifted ? styles.v3DayLifted : ''}`}>{day}</span>
            <div className={styles.v3Overlay}>
              <span className={styles.v3Weekday}>{weekdayName}</span>
              <span className={styles.v3MonthLine}>
                {monthName} &rsquo;{monthNumber}
              </span>
            </div>
          </div>
        </div>
      </header>
      {showMini && (
        <div className={styles.miniDate} onClick={handleDateClick}>
          <span className={styles.miniDateText}>
            {dayPadded}.{monthNumber}
          </span>
          <span className={styles.miniDateWeekday}>{weekdayNameShort}</span>
        </div>
      )}
    </>
  );
};

export default memo(Navigation);
