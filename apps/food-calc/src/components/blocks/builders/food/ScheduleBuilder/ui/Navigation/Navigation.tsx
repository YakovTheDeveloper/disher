import { observer } from 'mobx-react-lite';
import styles from './Navigation.module.scss';
import { NavLink, useNavigate, useSearchParams } from 'react-router';
import { RouterLinks } from '@/router';
// import { CalendarIcon } from '@icons';
import CalendarIcon from '@/assets/icons/calendar.svg';
import { useScheduleNavigation } from './context';

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
  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'short', timeZone: 'UTC' }).format(
    date
  );
  const monthNumber = new Intl.DateTimeFormat('ru-RU', {
    month: '2-digit',
    timeZone: 'UTC',
  }).format(date);

  const weekdayName = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
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
    <header className={styles.header}>
      {children}
      <div className={styles.container}>
        <button onClick={back}>{'<-'}</button>
        <NavLink className={styles.title} to={RouterLinks.Schedule}>
          <CalendarIcon color="lightblue" width="20px" height="20px" />
          <div className={styles.date}>
            {day}.{monthNumber}
          </div>
          <span>{weekdayName}</span>
        </NavLink>
        <button onClick={next}>{'->'}</button>
      </div>
    </header>
  );
};

export default observer(Navigation);
