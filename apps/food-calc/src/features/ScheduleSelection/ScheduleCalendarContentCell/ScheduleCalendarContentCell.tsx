import styles from './ScheduleCalendarContentCell.module.scss';
import clsx from 'clsx';
type Props = {
  children?: React.ReactNode;
  date: Date;
  getContentExist: (date: Date) => boolean;
};

const ScheduleCalendarContentCell = ({ date, getContentExist }: Props) => {
  const exist = getContentExist(date);

  return (
    <span className={clsx([styles.container, exist && styles.container_exist])}>
      {date.getUTCDate()}
    </span>
  );
};

export default ScheduleCalendarContentCell;
