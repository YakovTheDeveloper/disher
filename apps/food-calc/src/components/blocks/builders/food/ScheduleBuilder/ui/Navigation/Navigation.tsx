import { observer } from 'mobx-react-lite';
import styles from './Navigation.module.scss';
import { NavLink, useNavigate, useSearchParams } from 'react-router';
import { RouterLinks } from '@/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import {
  nextDate,
  prevDate,
  getTitle,
} from '@/components/blocks/builders/food/ScheduleBuilder/ui/Navigation/methods';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/components/common/Menu';
import CalendarIcon from '@/assets/icons/calendar.svg';
import { ScheduleUIEventEmitter } from '@/components/blocks/builders/food/shared/emitter';
import { uiStore } from '@/store/rootStore';
import { MenuUiStore } from '@/store/uiStore/menu/menuUiStore';

type Props = {
  children?: React.ReactNode;
  menuUi: MenuUiStore;
};

function isToday(date) {
  if (!(date instanceof Date)) {
    date = new Date(date); // allow strings or timestamps
  }

  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

const SWIPE_THRESHOLD = 50;

const Navigation = ({ children, menuUi = uiStore.menu }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') || new Date().toISOString();

  const { day, monthName, monthNumber, weekdayName } = getTitle(date);

  const updateDate = (newDate: string) => {
    navigate(`?date=${encodeURIComponent(newDate)}`);
  };

  const handleNext = () => updateDate(nextDate(date));
  const handleBack = () => updateDate(prevDate(date));

  // --- Swipe & Drag Logic ---
  const touchStartX = useRef<number | null>(null);

  const handleSwipe = (deltaX: number) => {
    if (deltaX > SWIPE_THRESHOLD) handleBack();
    else if (deltaX < -SWIPE_THRESHOLD) handleNext();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    handleSwipe(deltaX);
    touchStartX.current = null;
  };

  const onCopyFromSchedule = () => {
    ScheduleUIEventEmitter.emit('OPEN_COPY_SCHEDULE_MODAL');
  };

  const onCalendarButtonClick = () => navigate(RouterLinks.Schedule);

  return (
    <>
      <motion.header
        className={styles.wrapper}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.container}>
          <div className={clsx([styles.menuButton])}>
            <Button.Menu menu={menuUi} onClick={menuUi.toggle} />
          </div>
          <NavLink className={styles.title} to={RouterLinks.Schedule}>
            <motion.div className={styles.date}>
              <div className={styles.dateNumbers}>
                {/* {isToday(date) && <p className={styles.dateWordsToday}>сегодня</p>} */}

                <span>
                  {day}.{monthNumber}
                </span>
              </div>
              <div className={styles.dateWords}>
                <span>{weekdayName},</span>
                <span>{monthName}</span>
              </div>
            </motion.div>
          </NavLink>
        </div>
      </motion.header>

      <Menu store={menuUi}>
        <div className={styles.swipeButtons}>
          <button className={styles.swipeHint} onClick={handleBack}>
            ⬅︎
          </button>
          <button onClick={onCalendarButtonClick}>
            <CalendarIcon className={styles.menuNavIcon} />
          </button>
          <button className={styles.swipeHint} onClick={handleNext}>
            ➡︎
          </button>
        </div>
        <div>
          <button className={styles.buttonInMenu} onClick={onCopyFromSchedule}>
            Скопировать еду с другого дня
          </button>
        </div>
      </Menu>
    </>
  );
};

export default observer(Navigation);
