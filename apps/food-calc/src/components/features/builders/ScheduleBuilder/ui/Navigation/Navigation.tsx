import { observer } from 'mobx-react-lite';
import styles from './Navigation.module.scss';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { DateInfo } from './DateInfo';
import { ScheduleUIEventEmitter } from '@/components/features/builders/shared/emitter';
import { MenuUiStore } from '@/store/uiStore/menu/menuUiStore';
import { useScreenScroll } from '@/components/features/builders/shared/ui/layout/Screen/context/ScreenScrollContext';
import { motion, MotionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';

type Props = {
  children?: React.ReactNode;
  menuUi?: MenuUiStore;
  title?: React.ReactNode;
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

const Navigation = ({ title }: Props) => {
  const navigate = useNavigate();

  const scrollYProgress = useScreenScroll();
  const titleOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <header className={styles.header}>
      <motion.div className={styles.title} style={{ opacity: titleOpacity }}>
        <ScreenLabel variant="screenHeader">{title}</ScreenLabel>
      </motion.div>
      <div className={styles.container}>
        <DateInfo scrollYProgress={scrollYProgress} />
      </div>
    </header>
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
