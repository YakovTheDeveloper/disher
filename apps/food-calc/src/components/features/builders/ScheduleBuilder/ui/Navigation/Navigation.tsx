import { observer } from 'mobx-react-lite';
import styles from './Navigation.module.scss';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { MotionValue } from 'framer-motion';
import { DateInfo } from './DateInfo';
import { ScheduleUIEventEmitter } from '@/components/features/builders/shared/emitter';
import { MenuUiStore } from '@/store/uiStore/menu/menuUiStore';
import { useScreenScroll } from '@/components/features/builders/shared/ui/layout/Screen/context/ScreenScrollContext';

type Props = {
  children?: React.ReactNode;
  menuUi?: MenuUiStore;
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

const Navigation = ({ children }: Props) => {
  const navigate = useNavigate();

  const scrollYProgress = useScreenScroll();

  // const updateDate = (newDate: string) => {
  //   navigate(RouterLinks.ScheduleBuilder + newDate);
  // };

  // const handleNext = () => updateDate(nextDate(date));
  // const handleBack = () => updateDate(prevDate(date));

  const onCopyFromSchedule = () => {
    ScheduleUIEventEmitter.emit('OPEN_COPY_SCHEDULE_MODAL');
  };

  const onNewDish = () => {
    ScheduleUIEventEmitter.emit('CREATE_DISH');
  };

  const onCalendarButtonClick = () => navigate(RouterLinks.Schedule);

  return (
    <div className={styles.container}>
      <DateInfo scrollYProgress={scrollYProgress} />
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
//           </button>
