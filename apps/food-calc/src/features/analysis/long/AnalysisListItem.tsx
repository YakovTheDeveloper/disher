import { memo, useEffect, useState } from 'react';
import { deriveStatus, STALE_PENDING_MS, type AnalysisRowStatus, type Analysis } from '../api';
import { formatWindowLabel } from './range';
import { summaryLead } from './summaryPreview';
import { LongPressRow } from '@/features/shared/long-press-item';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import styles from './AnalysisListItem.module.scss';

type NonDone = Exclude<AnalysisRowStatus, 'done'>;

// Тело-плейсхолдер, пока «лид-абзаца» нет (summary пустой у идущего/протухшего,
// ⚠️-префикс у упавшего). Для 'done' тело = summaryLead(summary). У stale/failed
// статус несёт САМО тело + accent-полоска слева (CSS) — отдельной пилюли нет
// (только running показывает пилюлю «идёт» с пульс-точкой).
const BODY_PLACEHOLDER: Record<NonDone, string> = {
  running: 'Разбор идёт…',
  stale: 'Возможно, не удалось — попробуй перезапустить',
  failed: 'Разбор не удался',
};

// ─── Component ────────────────────────────────────────────────────────────

type Props = {
  analysis: Analysis;
  onOpen: (id: string) => void;
  /** Sustained press (~450ms) / Shift+F10 → per-row action drawer (delete). */
  onLongPress?: (analysis: Analysis) => void;
};

// One analysis card — indigo-плитка (унификация под карточки HomePage). Каркас —
// LongPressRow (перекрашен в семантический `--sys-color-surface-analysis`), но
// раскладка ручная (не compound Card): лид-абзац разбора = ВЕДУЩИЙ текст сверху,
// а дата — доминанта в правом-нижнем углу крупным <Heading role="headline">
// (редизайн 2026-07-04, решение юзера: «время вниз-вправо, текст крупнее»). Статус:
// running — пилюля «идёт» в том же нижнем ряду слева; stale/failed — accent-полоска
// слева (data-status, CSS) + текст-плейсхолдер; done — чисто. Tap открывает модалку;
// long press — action-дровер (удаление).
const AnalysisListItem = ({ analysis, onOpen, onLongPress }: Props) => {
  // `deriveStatus` reads the wall clock, so a `running` row that crosses the
  // 15-min staleness line will not re-flip on its own without a re-render.
  // Schedule one tick at the exact crossing so the row updates even if the
  // user just sits on the page (no list refetch).
  const [, forceTick] = useState(0);
  const status = deriveStatus(analysis);

  useEffect(() => {
    if (status !== 'running') return;
    const created = Date.parse(analysis.createdAt);
    if (Number.isNaN(created)) return;
    const msLeft = STALE_PENDING_MS - (Date.now() - created);
    if (msLeft <= 0) return;
    const t = setTimeout(() => forceTick((n) => n + 1), msLeft + 500);
    return () => clearTimeout(t);
  }, [status, analysis.createdAt]);

  const body = status === 'done' ? summaryLead(analysis.summary) : BODY_PLACEHOLDER[status];

  return (
    <LongPressRow
      id={analysis.id}
      className={styles.row}
      data-status={status}
      onClick={() => onOpen(analysis.id)}
      onLongPress={onLongPress ? () => onLongPress(analysis) : undefined}
    >
      <div className={styles.card}>
        {/* Лид-абзац разбора (или плейсхолдер) — ВЕДУЩИЙ текст, клэмп 2 строки. */}
        <Text role="body" className={styles.body}>
          {body}
        </Text>

        {/* Нижний ряд: пилюля «идёт» (running) слева + дата-доминанта справа
            (крупный <Heading role="headline">). stale/failed сигналят accent-
            полоской (CSS), done — только дата. */}
        <div className={styles.footer}>
          {status === 'running' && (
            <Text as="span" role="caption" className={styles.status}>
              <span className={styles.statusDot} aria-hidden="true" />
              идёт
            </Text>
          )}
          <Heading as="span" role="title" className={styles.date}>
            {formatWindowLabel(analysis.windowStart, analysis.windowEnd)}
          </Heading>
        </div>
      </div>
    </LongPressRow>
  );
};

export default memo(AnalysisListItem);
