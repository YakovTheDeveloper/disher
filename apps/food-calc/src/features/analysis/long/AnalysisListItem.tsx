import { memo, useEffect, useState } from 'react';
import { pluralHypotheses } from '@/shared/lib/text/pluralHypotheses';
import {
  deriveStatus,
  STALE_PENDING_MS,
  type AnalysisRowStatus,
  type Analysis,
} from '../api';
import { formatWindowLabel } from './range';
import { Card } from '@/shared/ui/atoms/Card';
import { Text, QuietLabel } from '@/shared/ui/atoms/Typography';
import styles from './AnalysisListItem.module.scss';

const STATUS_LABEL: Record<AnalysisRowStatus, string> = {
  running: 'идёт',
  stale: 'возможно, не удалось',
  failed: 'не удался',
  done: 'готов',
};

// ─── Component ────────────────────────────────────────────────────────────

type Props = {
  analysis: Analysis;
  onOpen: (id: string) => void;
  /** Sustained press (~450ms) / Shift+F10 → per-row action drawer (delete). */
  onLongPress?: (analysis: Analysis) => void;
};

// One long-analysis row — now the Card compound (Card.Root = LongPressRow surface
// + 2-row geometry). The tod-palette chassis is neutralized to the flat neutral
// analyses tone (`--sys-card-*`) via the `.row` className; the accent stripe +
// status pill carry the derived state. Tap opens the detail modal; a long press
// opens the action drawer (delete).
const AnalysisListItem = ({ analysis, onOpen, onLongPress }: Props) => {
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
    <Card.Root
      id={analysis.id}
      className={styles.row}
      data-status={status}
      onClick={() => onOpen(analysis.id)}
      onLongPress={onLongPress ? () => onLongPress(analysis) : undefined}
    >
      {/* Title = period (serif-italic QuietLabel голос — node-escape, не sans). */}
      <Card.Title>
        <QuietLabel className={styles.period}>
          {formatWindowLabel(analysis.windowStart, analysis.windowEnd)}
        </QuietLabel>
      </Card.Title>

      {/* Meta = hypothesis count (Card строит sans-caption, muted). */}
      <Card.Meta className={styles.meta}>
        {hypothesisCount > 0
          ? `${hypothesisCount} ${pluralHypotheses(hypothesisCount)}`
          : 'без гипотез'}
      </Card.Meta>

      {/* metaEnd (Card.Time trailing slot) = status pill, node-escape. */}
      <Card.Time>
        <Text as="span" role="caption" className={styles.status} data-status={status}>
          {status === 'running' && (
            <span className={styles.statusDot} aria-hidden="true" />
          )}
          {STATUS_LABEL[status]}
        </Text>
      </Card.Time>
    </Card.Root>
  );
};

export default memo(AnalysisListItem);
