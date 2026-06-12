import { memo } from 'react';
import type { AnalysisInsight, AnalysisStrength } from '../api';
import styles from './InsightCard.module.scss';

type Props = {
  insight: AnalysisInsight;
};

// How sure the model is the pattern is real. Drives the left-accent colour and
// a small label — the user reads «слабая/есть/явная» rather than a raw enum.
const STRENGTH_LABEL: Record<AnalysisStrength, string> = {
  weak: 'слабая связь',
  moderate: 'есть связь',
  clear: 'явная связь',
};

// One insight = one read-only observation. NOT addable (by design, first
// iteration). The evidence row is the point: every insight shows the concrete
// days (and optionally foods/events) it was built from, so a fabricated pattern
// has nowhere to hide. Warm stripe-fork surface (design-DNA canon).
const InsightCard = ({ insight }: Props) => {
  const { title, detail, strength, evidence } = insight;
  return (
    <article className={styles.card} data-strength={strength}>
      <div className={styles.text}>
        <div className={styles.head}>
          <h3 className={styles.title}>{title}</h3>
          <span className={styles.strength}>{STRENGTH_LABEL[strength]}</span>
        </div>
        <p className={styles.detail}>{detail}</p>
        <div className={styles.evidence}>
          {evidence.days.map((d) => (
            <span key={`d-${d}`} className={styles.chipDay}>
              {d}
            </span>
          ))}
          {evidence.foods?.map((f) => (
            <span key={`f-${f}`} className={styles.chipFood}>
              {f}
            </span>
          ))}
          {evidence.events?.map((e) => (
            <span key={`e-${e}`} className={styles.chipEvent}>
              {e}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
};

export default memo(InsightCard);
