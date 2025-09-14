import { observer } from 'mobx-react-lite';
import styles from './Navigation.module.scss';
import { NavLink, useNavigate, useSearchParams } from 'react-router';
import { RouterLinks } from '@/router';
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
  const weekdayName = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', timeZone: 'UTC' }).format(
    date
  );

  return `${day} ${monthName}, ${weekdayName}`;
};

const Navigation = ({ children }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') || new Date().toISOString();

  const next = () => {
    const nextISO = nextDate(date);
    navigate(`?date=${encodeURIComponent(nextISO)}`);
  };

  const back = () => {
    const prevISO = prevDate(date);
    navigate(`?date=${encodeURIComponent(prevISO)}`);
  };

  return (
    <div className={styles.container}>
      <button onClick={back}>{'<-'}</button>
      <NavLink to={RouterLinks.Schedule}>{getTitle(date)}</NavLink>
      <button onClick={next}>{'->'}</button>
    </div>
  );
};

export default observer(Navigation);
