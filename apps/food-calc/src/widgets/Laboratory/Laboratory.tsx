import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { parse, format, subDays, isValid } from 'date-fns';
import { db } from '@/shared/lib/dexie/schema';
import { RunAnalysisButton } from '@/features/analysis/RunAnalysisButton';
import { useOpenHypotheses, useClosedHypotheses } from '@/entities/hypothesis';
import { Screen } from '@/shared/ui/Screen';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar';
import HypothesisCard from './HypothesisCard';
import styles from './Laboratory.module.scss';

type Props = {
  date: string;
};

function useEventCountLast7Days(date: string): number | undefined {
  const dateSet = useMemo(() => {
    const anchor = parse(date, 'dd-MM-yyyy', new Date());
    if (!isValid(anchor)) return null;
    const set = new Set<string>();
    for (let i = 0; i < 7; i++) {
      set.add(format(subDays(anchor, i), 'dd-MM-yyyy'));
    }
    return set;
  }, [date]);

  return useLiveQuery(async () => {
    if (!dateSet) return 0;
    const [foods, events] = await Promise.all([
      db.schedule_foods.filter((r) => dateSet.has(r.date)).count(),
      db.schedule_events.filter((r) => dateSet.has(r.date)).count(),
    ]);
    return foods + events;
  }, [dateSet]);
}

const Laboratory = ({ date }: Props) => {
  const eventCount = useEventCountLast7Days(date);
  const open = useOpenHypotheses();
  const closed = useClosedHypotheses();

  return (
    <Screen
      headerOverlap
      hollow={open.length === 0 && (eventCount ?? 0) === 0}
      bottomBar={
        <AppBottomBarShell>
          <RunAnalysisButton
            date={date}
            disabled={(eventCount ?? 0) === 0}
            disabledHint="Нет данных за последние 7 дней"
          />
        </AppBottomBarShell>
      }
    >
      <div className={styles.container}>
        <section className={styles.block}>
          <p className={styles.blockTitle}>Мои гипотезы</p>
          {open.length === 0 ? (
            <>
              <p className={styles.blockBody}>Сейчас ничего не тестируешь.</p>
              <p className={styles.blockHint}>
                Запусти разбор — получишь идеи для проверки.
              </p>
            </>
          ) : (
            <div className={styles.hypothesesList}>
              {open.map((h) => (
                <HypothesisCard key={h.id} hypothesis={h} />
              ))}
            </div>
          )}
        </section>

        <section className={styles.block}>
          <p className={styles.blockTitle}>Разбор данных</p>
          <p className={styles.blockBody}>
            За 7 дней — {eventCount ?? '…'} {pluralEvents(eventCount)}.
          </p>
        </section>

        <Link to="/knowledge" className={styles.block}>
          <p className={styles.blockTitle}>Что я знаю про себя</p>
          <p className={styles.blockBody}>
            {closed.length > 0
              ? `${closed.length} ${pluralRecords(closed.length)}`
              : 'Закрытые гипотезы появятся здесь.'}
          </p>
        </Link>
      </div>
    </Screen>
  );
};

function pluralEvents(n: number | undefined): string {
  if (n === undefined) return 'событий';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'событие';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'события';
  return 'событий';
}

function pluralRecords(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'гипотеза';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'гипотезы';
  return 'гипотез';
}

export default memo(Laboratory);
