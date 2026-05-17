import { memo, useEffect, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  deriveStatus,
  STALE_PENDING_MS,
  type AnalysisRowStatus,
  type Analysis,
} from '../api';
import styles from './AnalysisListItem.module.scss';

const STATUS_LABEL: Record<AnalysisRowStatus, string> = {
  running: 'идёт',
  stale: 'возможно, не удалось',
  failed: 'не удался',
  done: 'готов',
};

function formatRange(startIso: string, endIso: string): string {
  const s = parseISO(startIso);
  const e = parseISO(endIso);
  if (!isValid(s) || !isValid(e)) return '—';
  return `${format(s, 'd MMM', { locale: ru })} — ${format(e, 'd MMM', { locale: ru })}`;
}

// ─── Component ────────────────────────────────────────────────────────────

type Props = {
  analysis: Analysis;
  onOpen: (id: string) => void;
};

// One long-analysis row — stripe-fork surface. The accent stripe + status
// pill carry the derived state; the palette CSS-vars (`--la-*`) and the
// nth-child rhythm come from the parent `[data-dv='LabAnalysis']` anchor.
const AnalysisListItem = ({ analysis, onOpen }: Props) => {
  // `deriveStatus` reads the wall clock, so a `running` row that crosses the
  // 15-min staleness line will not re-flip on its own without a re-render.
  // Schedule one tick at the exact crossing so the row updates even if the
  // user just sits on the page (no list refetch).
  const [, forceTick] = useState(0);
  const status = deriveStatus(analysis);
  const hypothesisCount = analysis.appliedHypotheses.length;

  useEffect(() => {
    if (status !== 'running') return;
    const created = Date.parse(analysis.createdAt);
    if (Number.isNaN(created)) return;
    const msLeft = STALE_PENDING_MS - (Date.now() - created);
    if (msLeft <= 0) return;
    const t = setTimeout(() => forceTick((n) => n + 1), msLeft + 500);
    return () => clearTimeout(t);
  }, [status, analysis.createdAt]);

  return (
    <button
      type="button"
      className={styles.row}
      data-status={status}
      onClick={() => onOpen(analysis.id)}
    >
      <span className={styles.main}>
        <span className={styles.period}>
          {formatRange(analysis.windowStart, analysis.windowEnd)}
        </span>
        <span className={styles.meta}>
          {hypothesisCount > 0
            ? `${hypothesisCount} ${pluralHypotheses(hypothesisCount)}`
            : 'без гипотез'}
        </span>
      </span>
      <span className={styles.status} data-status={status}>
        {status === 'running' && (
          <span className={styles.statusDot} aria-hidden="true" />
        )}
        {STATUS_LABEL[status]}
      </span>
    </button>
  );
};

function pluralHypotheses(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'гипотеза';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return 'гипотезы';
  return 'гипотез';
}

export default memo(AnalysisListItem);
