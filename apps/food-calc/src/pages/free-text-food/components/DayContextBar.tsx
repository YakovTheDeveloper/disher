import { useMemo } from 'react';
import { useScheduleFoods } from '@/entities/schedule-food';
import styles from './ContextBar.module.scss';

export interface DayContextBarProps {
  date: string;
}

export const DayContextBar = ({ date }: DayContextBarProps) => {
  const items = useScheduleFoods(date);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.time.localeCompare(b.time)),
    [items],
  );

  const heading = formatHeading(date);

  return (
    <div className={styles.bar}>
      <div className={styles.headingRow}>
        <span className={styles.heading}>{heading}</span>
        {items.length === 0 && <span className={styles.muted}>День пуст</span>}
      </div>
      {items.length > 0 && (
        <div className={styles.chipRow}>
          {sorted.map((item) => (
            <div key={item.id} className={styles.chip}>
              <span className={styles.chipTime}>{item.time}</span>
              <span className={styles.chipName}>
                {item.product?.name ?? item.dish?.name ?? '—'}
              </span>
              <span className={styles.chipQty}>{item.quantity}г</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function formatHeading(date: string): string {
  // date format: dd-MM-yyyy
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  const [dd, mm] = parts;
  const monthNames = [
    'янв', 'фев', 'мар', 'апр', 'май', 'июн',
    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
  ];
  const monthIdx = Math.max(0, Math.min(11, Number(mm) - 1));
  return `${Number(dd)} ${monthNames[monthIdx]}`;
}

export default DayContextBar;
