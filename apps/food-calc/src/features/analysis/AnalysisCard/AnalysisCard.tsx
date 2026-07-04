import { memo, type ReactNode } from 'react';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './AnalysisCard.module.scss';

// AnalysisCard — общий layout-каркас карточек разбора. Ветки InsightCard +
// HypothesisCard (features/analysis/AnalysisCard) кладут в него слоты; сам каркас
// entity-agnostic и знает только раскладку (split 2026-07-04 — был единый
// ObservationCard). Слоты:
//   • title      — заголовок (Heading role="title", монохром «эталона»).
//   • metaCorner — правый-верхний угол: знак valence + значок силы (инсайт).
//   • caption    — тихая мета под заголовком («проверить ~N дн.» у гипотезы).
//   • detail     — тело (Text role="body").
//   • footerLeft — нижний ряд слева: evidence (инсайт) / дата (added-гипотеза).
//   • footerRight— нижний ряд справа: «Сохранить» (not-added) / шеврон (added).
// Нижний ряд рисуется только когда есть footerLeft ИЛИ footerRight.
type Props = {
  title: string;
  detail?: string;
  caption?: ReactNode;
  metaCorner?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  /** «Только что создан» — эфемерное кольцо (сохранённые гипотезы). */
  isNew?: boolean;
};

const AnalysisCard = ({
  title,
  detail,
  caption,
  metaCorner,
  footerLeft,
  footerRight,
  isNew = false,
}: Props) => {
  const hasFooter = Boolean(footerLeft || footerRight);
  return (
    <article className={styles.card} data-new={isNew || undefined}>
      <div className={styles.text}>
        <div className={styles.head}>
          <Heading as="h3" role="title" className={styles.cardTitle}>
            {title}
          </Heading>
          {metaCorner && <span className={styles.metaCorner}>{metaCorner}</span>}
        </div>

        {caption && (
          <Text as="span" role="caption" className={styles.hint}>
            {caption}
          </Text>
        )}

        {detail && (
          <Text role="body" className={styles.detail}>
            {detail}
          </Text>
        )}

        {hasFooter && (
          <div className={styles.footer}>
            {footerLeft && (
              <Text as="span" role="caption" className={styles.footerLeft}>
                {footerLeft}
              </Text>
            )}
            {footerRight && <div className={styles.footerRight}>{footerRight}</div>}
          </div>
        )}
      </div>
    </article>
  );
};

export default memo(AnalysisCard);
