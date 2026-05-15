import { memo } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  isFailedAnalysis,
  isPendingAnalysis,
  type Analysis,
} from '../api';
import styles from './AnalysisListItem.module.scss';

// ─── Pure status derivation (unit-tested) ─────────────────────────────────

/**
 * A pending row whose job died (backend restart, crash) sits at result_md=''
 * forever. After this much wall-clock the list stops calling it «идёт» and
 * marks it «возможно, не удалось» — a client-side heuristic, no extra request.
 */
export const STALE_PENDING_MS = 15 * 60 * 1000;

export type AnalysisRowStatus = 'running' | 'stale' | 'failed' | 'done';

export function deriveStatus(
  a: Analysis,
  now: number = Date.now(),
): AnalysisRowStatus {
  if (isFailedAnalysis(a)) return 'failed';
  if (isPendingAnalysis(a)) {
    const created = Date.parse(a.createdAt);
    if (Number.isNaN(created)) return 'running';
    // Boundary: exactly STALE_PENDING_MS old is still «идёт».
    return now - created > STALE_PENDING_MS ? 'stale' : 'running';
  }
  return 'done';
}

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
  const status = deriveStatus(analysis);
  const hypothesisCount = analysis.appliedHypotheses.length;

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
