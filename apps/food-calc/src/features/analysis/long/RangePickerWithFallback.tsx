import { memo } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { FieldLabel } from '@/shared/ui/atoms/Typography/FieldLabel';
import { Text } from '@/shared/ui/atoms/Typography';
import {
  MAX_WINDOW_DAYS,
  MIN_WINDOW_DAYS,
  endsInFuture,
  isValidWindow,
  windowSpanDays,
  type DateRange,
} from './range';
import MaskedDateInput from './MaskedDateInput';
import styles from './RangePickerWithFallback.module.scss';

function formatHuman(key: string): string {
  const d = parseISO(key);
  return isValid(d) ? format(d, 'd MMMM', { locale: ru }) : key;
}

const START_ID = 'long-analysis-window-start';
const END_ID = 'long-analysis-window-end';

type Props = {
  value: DateRange;
  onChange: (next: DateRange) => void;
};

// Long-analysis window picker — two manual DD-MM-YYYY masked fields. The
// «Календарь / Вручную» toggle (and the react-day-picker surface) was removed
// 2026-06-13: one manual surface, app-owned date format. The host validates the
// span (7..35 days, end ≥ start, end ≤ today) before enabling submit.
const RangePickerWithFallback = ({ value, onChange }: Props) => {
  const span = windowSpanDays(value);
  const spanKnown = Number.isFinite(span);
  const future = endsInFuture(value);

  return (
    <div className={styles.root}>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <FieldLabel htmlFor={START_ID}>Начало</FieldLabel>
          <MaskedDateInput
            id={START_ID}
            className={styles.input}
            value={value.start}
            onChange={(start) => onChange({ ...value, start })}
          />
        </div>
        <div className={styles.field}>
          <FieldLabel htmlFor={END_ID}>Конец</FieldLabel>
          <MaskedDateInput
            id={END_ID}
            className={styles.input}
            value={value.end}
            onChange={(end) => onChange({ ...value, end })}
          />
        </div>
      </div>

      <Text
        as="p"
        role="caption"
        className={
          spanKnown && isValidWindow(value) && !future
            ? styles.summary
            : `${styles.summary} ${styles.summaryInvalid}`
        }
      >
        {spanKnown ? (
          <>
            {formatHuman(value.start)} — {formatHuman(value.end)}
            <span className={styles.summarySpan}> · {span} дней</span>
          </>
        ) : (
          'Введи даты окна'
        )}
        {spanKnown && !isValidWindow(value) && (
          <Text as="span" role="caption" className={styles.summaryHint}>
            {' '}
            — окно должно быть от {MIN_WINDOW_DAYS} до {MAX_WINDOW_DAYS} дней
          </Text>
        )}
        {spanKnown && isValidWindow(value) && future && (
          <Text as="span" role="caption" className={styles.summaryHint}>
            {' '}
            — конец не может быть в будущем
          </Text>
        )}
      </Text>
    </div>
  );
};

export default memo(RangePickerWithFallback);
