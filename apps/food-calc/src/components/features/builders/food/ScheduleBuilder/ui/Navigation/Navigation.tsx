import { observer } from 'mobx-react-lite';
import styles from './Navigation.module.scss';
import { NavLink, useNavigate, useSearchParams } from 'react-router';
import { RouterLinks } from '@/router';
import { motion, MotionValue, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  nextDate,
  prevDate,
  getTitle,
} from '@/components/features/builders/food/ScheduleBuilder/ui/Navigation/methods';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/components/shared/Menu';
import CalendarIcon from '@/assets/icons/calendar.svg';
import { ScheduleUIEventEmitter } from '@/components/features/builders/food/shared/emitter';
import { uiStore } from '@/store/rootStore';
import { MenuUiStore } from '@/store/uiStore/menu/menuUiStore';
import { emitter } from '@/infrastructure/emitter/emitter';
import { ActionsHeader } from '@/components/features/builders/food/shared/components/ActionsHeader';
import { domainStore } from '@/store/store';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';

type Props = {
  children?: React.ReactNode;
  menuUi?: MenuUiStore;

  scrollData: {
    scrollY: MotionValue<number>;
    scrollYProgress: MotionValue<number>;
  };
};

function isToday(date: string | Date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

const Navigation = ({ children, menuUi = uiStore.menu, scrollData }: Props) => {
  console.log('scrollData', scrollData);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') || new Date().toISOString();

  const { day, monthName, monthNumber, weekdayName } = getTitle(date);

  const updateDate = (newDate: string) => {
    navigate(RouterLinks.ScheduleBuilder + newDate);
  };

  const handleNext = () => updateDate(nextDate(date));
  const handleBack = () => updateDate(prevDate(date));

  const onCopyFromSchedule = () => {
    ScheduleUIEventEmitter.emit('OPEN_COPY_SCHEDULE_MODAL');
  };

  const onNewDish = () => {
    ScheduleUIEventEmitter.emit('CREATE_DISH');
  };

  const onCalendarButtonClick = () => navigate(RouterLinks.Schedule);

  const headerY = useTransform(scrollData.scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className={styles.container}>
      <div className={styles.title}>{children}</div>
      {domainStore.globalUiStore.isActionsMode && <ActionsHeader />}
      {!domainStore.globalUiStore.isActionsMode && (
        <>
          <div className={clsx([styles.menuButton])}>
            <Button.Menu menu={menuUi} onClick={menuUi.toggle} />
          </div>
          <NavLink className={styles.dateLink} to={RouterLinks.Schedule}>
            <motion.div className={styles.date}>
              <div className={styles.dateNumbers}>
                {/* {isToday(date) && <p className={styles.dateWordsToday}>сегодня</p>} */}
                <span>
                  {day}.{monthNumber}
                </span>
              </div>
              <motion.div className={styles.dateWords} style={{ opacity: headerY }}>
                <span>{weekdayName},</span>
                <span>{monthName}</span>
              </motion.div>
            </motion.div>
          </NavLink>
        </>
      )}
    </div>
  );
};

export default observer(Navigation);

//  <Menu store={menuUi}>
//         <div className={styles.swipeButtons}>
//           <button className={styles.swipeHint} onClick={handleBack}>
//             ⬅︎
//           </button>
//           <button onClick={onCalendarButtonClick}>
//             <CalendarIcon className={styles.menuNavIcon} />
//           </button>
//           <button className={styles.swipeHint} onClick={handleNext}>
//             ➡︎
//           </button>
//         </div>
//         <div>
//           <button className={styles.buttonInMenu} onClick={onCopyFromSchedule}>
//             Скопировать еду с другого дня
//           </button>
//           <button className={styles.buttonInMenu} onClick={onNewDish}>
//             Создать блюдо
//           </button>
//         </div>
//       </Menu>
