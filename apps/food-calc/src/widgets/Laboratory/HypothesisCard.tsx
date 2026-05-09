import { memo, useCallback, useState } from 'react';
import {
  closeHypothesis,
  deleteHypothesis,
  startTestingHypothesis,
  type Hypothesis,
} from '@/entities/hypothesis';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import styles from './HypothesisCard.module.scss';

type Props = {
  hypothesis: Hypothesis;
};

function daySinceStart(startedAtIso: string | null): number | null {
  if (!startedAtIso) return null;
  const d = parseISO(startedAtIso);
  if (Number.isNaN(d.getTime())) return null;
  // Calendar-day diff (DST-safe). Day 1 = same calendar day.
  return differenceInCalendarDays(new Date(), d) + 1;
}

const HypothesisCard = ({ hypothesis }: Props) => {
  const [closing, setClosing] = useState(false);
  const [outcome, setOutcome] = useState('');
  const isTesting = !!hypothesis.startedAt && !hypothesis.endedAt;
  const day = daySinceStart(hypothesis.startedAt);

  const handleStart = useCallback(() => {
    void startTestingHypothesis(hypothesis.id);
  }, [hypothesis.id]);

  const handleClose = useCallback(async () => {
    await closeHypothesis(hypothesis.id, outcome);
    setClosing(false);
    setOutcome('');
  }, [hypothesis.id, outcome]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Удалить эту гипотезу?')) {
      void deleteHypothesis(hypothesis.id);
    }
  }, [hypothesis.id]);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{hypothesis.title}</h3>
        {isTesting && day != null && (
          <span className={styles.dayBadge}>день {day}</span>
        )}
      </header>
      {hypothesis.body && <p className={styles.body}>{hypothesis.body}</p>}
      {hypothesis.days != null && (
        <p className={styles.meta}>план: {hypothesis.days} дней</p>
      )}

      {!closing && (
        <div className={styles.actionRow}>
          {isTesting ? (
            <button
              type="button"
              className={styles.outlineButton}
              onClick={() => setClosing(true)}
            >
              Закрыть с выводом
            </button>
          ) : (
            <button
              type="button"
              className={styles.runButton}
              onClick={handleStart}
            >
              Тестирую
            </button>
          )}
          <button
            type="button"
            className={styles.iconButton}
            onClick={handleDelete}
            aria-label="Удалить"
          >
            ×
          </button>
        </div>
      )}

      {closing && (
        <div className={styles.closeForm}>
          <textarea
            className={styles.textarea}
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="что заметил, какой вывод"
            autoFocus
            rows={3}
          />
          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.outlineButton}
              onClick={() => {
                setClosing(false);
                setOutcome('');
              }}
            >
              Отмена
            </button>
            <button
              type="button"
              className={styles.runButton}
              onClick={handleClose}
            >
              Сохранить вывод
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

export default memo(HypothesisCard);
