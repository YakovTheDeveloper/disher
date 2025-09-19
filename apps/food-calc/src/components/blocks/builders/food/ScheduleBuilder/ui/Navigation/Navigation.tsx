import { observer } from 'mobx-react-lite';
import styles from './Navigation.module.scss';
import { NavLink, useNavigate, useSearchParams } from 'react-router';
import { RouterLinks } from '@/router';
import CalendarIcon from '@/assets/icons/calendar.svg';
import { useScheduleNavigation } from './context';
import ArrowLeftIcon from '@/assets/icons/arrowLeft.svg';
import ArrowRightIcon from '@/assets/icons/arrowRight.svg';

import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  children: React.ReactNode;
};

const nextDate = (currentDateISO: string) => {
  const date = new Date(currentDateISO);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
};

const prevDate = (currentDateISO: string) => {
  const date = new Date(currentDateISO);
  date.setDate(date.getDate() - 1);
  return date.toISOString();
};

const getTitle = (input: string) => {
  const date = new Date(input);

  const day = date.getUTCDate();
  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long', timeZone: 'UTC' }).format(
    date
  );
  const monthNumber = new Intl.DateTimeFormat('ru-RU', {
    month: '2-digit',
    timeZone: 'UTC',
  }).format(date);

  const weekdayName = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(date);

  return {
    day,
    monthNumber,
    monthName,
    weekdayName,
  };
};

const Navigation = ({ children }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') || new Date().toISOString();

  const next = () => {
    const nextISO = nextDate(date);
    navigate(`?date=${encodeURIComponent(nextISO)}`);
  };

  const back = async () => {
    const prevISO = prevDate(date);
    navigate(`?date=${encodeURIComponent(prevISO)}`);
  };

  const { day, monthName, monthNumber, weekdayName } = getTitle(date);

  return (
    <motion.header
      className={styles.container}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button className={styles.navButton} onClick={back}>
        <ArrowLeftIcon />
      </button>

      <NavLink className={styles.title} to={RouterLinks.Schedule}>
        <AnimatePresence mode="wait">
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={styles.date}
          >
            <div className={styles.dateNumbers}>
              {day}.{monthNumber}
            </div>
            <div className={styles.dateWords}>
              <span>{weekdayName} </span>
              <span>{monthName}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </NavLink>

      <button className={styles.navButton} onClick={next}>
        <ArrowRightIcon />
      </button>
    </motion.header>
  );
};

export default observer(Navigation);
