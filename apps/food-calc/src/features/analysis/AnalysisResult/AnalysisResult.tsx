import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { SheetCard } from '@/shared/ui/SheetCard';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import type { InsightSource } from '@/entities/insight';
import { InsightCard } from '../InsightCard';
import { HypothesisCard } from '../HypothesisCard';
import type { AnalysisInsight, AnalysisHypothesis } from '../api';
import styles from './AnalysisResult.module.scss';

// Valence-display variants (F3 «хз» → pick by eye). The anchor sits on the
// sections wrapper so every InsightCard inside reads the chosen mode via CSS —
// one anchor per surface (not per card). Default 'sign'.
const INSIGHT_VALENCE_VARIANTS = ['sign', 'label', 'plain'] as const;

// Visual treatment of the observation/hypothesis rows inside the pearl листок
// (monochrome by design — see 2026-06-13 «слишком цветасто»). The anchor sits on
// the result root and publishes `--ax-*` custom props that BOTH card modules
// (InsightCard / HypothesisCard) consume, so a single тумблер restyles the whole
// разбор. Default 'hairline' = плоский текст + канон-бровка между строками.
//   hairline — flush rows, fading hairline divider (бровка)
//   rail     — thin neutral left accent (density = сила связи), no line
//   inset    — barely-there neutral wash + soft radius, texture без линий
//   card     — restored white elevated card (flat↔card A/B)
const ANALYSIS_STYLE_VARIANTS = ['hairline', 'rail', 'inset', 'card'] as const;

type Props = {
  summary: string;
  insights: AnalysisInsight[];
  hypotheses: AnalysisHypothesis[];
  /** Which разбор this is — recorded on each insight the user adds («Добавить к
   *  себе»). daily inline → 'daily', long detail → 'long', dish → 'dish'. */
  insightSource?: InsightSource;
  /** Forwarded to InsightCard. Daily analysis passes `false` to drop the
   *  always-«сегодня» day-chip; long analysis keeps days. */
  showDays?: boolean;
  /** Bare mode: секции без pearl-плашки (заголовок + список прямо на
   *  поверхности). Длинный разбор (AnalysisDetailModal) стоит на бледном
   *  ModalShell-фоне — pearl-плашка там не отделялась бы (pearl-на-pearl), а
   *  тёплого HomeAmbient под ней нет. Дом — с плашкой (по умолчанию). */
  bare?: boolean;
  /** Дом: summary едет СВОЕЙ pearl-плашкой (отдельная секция-подложка), а не
   *  lead-абзацем — три плашки (summary / Наблюдения / Гипотезы) плавают на
   *  ambient'е без единого «листа». Только non-bare; dish/long оставляют
   *  lead-абзац. */
  summaryCard?: boolean;
};

// Shared render of a finished structured analysis — same body for the daily
// inline section and the long detail modal. Three blocks, each shown only when
// it has content: summary (markdown) → insights (read-only observations) →
// hypotheses (addable experiments). На доме наблюдения/гипотезы живут в pearl-
// плашке SheetCard; в `bare`-режиме — секцией с заголовком, без плашки.
//
// Array defaults are a safety net: a stale cache record (older shape) can reach
// here with insights/hypotheses === undefined; default to [] so `.length` never
// throws even if the data boundary (hydrate/mapper) missed it.
const AnalysisResult = ({
  summary,
  insights = [],
  hypotheses = [],
  insightSource = 'daily',
  showDays = true,
  bare = false,
  summaryCard = false,
}: Props) => {
  const { anchor: valenceAnchor } = useDesignVariant('Insight', INSIGHT_VALENCE_VARIANTS);
  const { anchor: styleAnchor } = useDesignVariant('Analysis', ANALYSIS_STYLE_VARIANTS);
  const renderSection = (title: string, children: React.ReactNode) =>
    bare ? (
      <section className={styles.bareBlock}>
        <Heading size="drawer" as="h3" className={styles.bareHead}>
          {title}
        </Heading>
        <div className={styles.list}>{children}</div>
      </section>
    ) : (
      <SheetCard header={title}>
        <div className={styles.list}>{children}</div>
      </SheetCard>
    );

  return (
    <div className={styles.root} {...styleAnchor}>
      {summary &&
        (summaryCard && !bare ? (
          <SheetCard>
            <div className={styles.summaryBody}>
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </SheetCard>
        ) : (
          <div className={styles.summary}>
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        ))}

      <div className={styles.sections} {...valenceAnchor}>
        {insights.length > 0 &&
          renderSection(
            'Наблюдения',
            insights.map((insight, idx) => (
              <InsightCard
                key={idx}
                insight={insight}
                showDays={showDays}
                action="add"
                source={insightSource}
              />
            )),
          )}

        {hypotheses.length > 0 &&
          renderSection(
            'Гипотезы — что проверить',
            hypotheses.map((hypothesis, idx) => (
              <HypothesisCard key={idx} hypothesis={hypothesis} />
            )),
          )}
      </div>
    </div>
  );
};

export default memo(AnalysisResult);
