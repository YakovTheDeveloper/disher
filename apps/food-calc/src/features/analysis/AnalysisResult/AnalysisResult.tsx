import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { InsightCard } from '../InsightCard';
import { HypothesisCard } from '../HypothesisCard';
import type { AnalysisInsight, AnalysisHypothesis } from '../api';
import styles from './AnalysisResult.module.scss';

type Props = {
  summary: string;
  insights: AnalysisInsight[];
  hypotheses: AnalysisHypothesis[];
};

// Shared render of a finished structured analysis — same body for the daily
// inline section and the long detail modal. Three blocks, each shown only when
// it has content: summary (markdown) → insights (read-only observations) →
// hypotheses (addable experiments).
//
// Array defaults are a safety net: a stale cache record (older shape) can reach
// here with insights/hypotheses === undefined; default to [] so `.length` never
// throws even if the data boundary (hydrate/mapper) missed it.
const AnalysisResult = ({
  summary,
  insights = [],
  hypotheses = [],
}: Props) => (
  <div className={styles.root}>
    {summary && (
      <div className={styles.summary}>
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    )}

    {insights.length > 0 && (
      <section className={styles.block}>
        <p className={styles.blockTitle}>Наблюдения</p>
        <div className={styles.list}>
          {insights.map((insight, idx) => (
            <InsightCard key={idx} insight={insight} />
          ))}
        </div>
      </section>
    )}

    {hypotheses.length > 0 && (
      <section className={styles.block}>
        <p className={styles.blockTitle}>Гипотезы — что проверить</p>
        <div className={styles.list}>
          {hypotheses.map((hypothesis, idx) => (
            <HypothesisCard key={idx} hypothesis={hypothesis} />
          ))}
        </div>
      </section>
    )}
  </div>
);

export default memo(AnalysisResult);
