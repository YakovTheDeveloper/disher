import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { SheetCard } from '@/shared/ui/SheetCard';
import type { InsightSource } from '@/entities/insight';
import { InsightCard } from '../InsightCard';
import { HypothesisCard } from '../HypothesisCard';
import type { AnalysisObservation, AnalysisInsight, AnalysisHypothesis } from '../api';
import styles from './AnalysisResult.module.scss';

// Visual treatment of the observation/hypothesis rows inside the pearl листок
// (monochrome by design — see 2026-06-13 «слишком цветасто»). The `--ax-*` custom
// props that BOTH card modules (InsightCard / HypothesisCard) consume are baked on
// the result `.root` (AnalysisResult.module.scss) — flat monochrome text, rows
// parted by air (the hairline divider was dropped 2026-06-22; the 'Analysis'
// DesignBar axis is retired).
type Props = {
  summary: string;
  /** Neutral patterns — read-only reference, NOT saveable (no «+ к себе»). */
  observations: AnalysisObservation[];
  insights: AnalysisInsight[];
  hypotheses: AnalysisHypothesis[];
  /** Which разбор this is — recorded on each insight the user adds («Добавить к
   *  себе»). daily inline → 'daily', long detail → 'long', dish → 'dish'. */
  insightSource?: InsightSource;
  /** Forwarded to InsightCard. Daily analysis passes `false` to drop the
   *  always-«сегодня» day-chip; long analysis keeps days. */
  showDays?: boolean;
  /** Bare mode: секции без pearl-плашки (список прямо на поверхности). Длинный
   *  разбор (AnalysisDetailModal) и дом — без плашки; разбор блюда — с плашкой
   *  (по умолчанию). */
  bare?: boolean;
  /** Дом (bare): убрать под-заголовки секций («Наблюдения» / «Гипотезы — что
   *  проверить») — разбор живёт текстом прямо на стекле, иерархию несут
   *  типографика + бровки. Длинный разбор под-заголовки оставляет. */
  hideSectionHeaders?: boolean;
  /** Sheet-режим (не-bare): заголовок pearl-плашки SheetCard. Разбор блюда
   *  подаёт «Результат». Пусто → плашка без header-блока (см. SheetCard). */
  sheetHeader?: string;
};

// Shared render of a finished structured analysis — same body for the daily
// inline section and the long detail modal. FOUR blocks, each shown only when it
// has content: summary (markdown) → наблюдения (read-only patterns, reference) →
// инсайты (valenced, addable «+ к себе») → гипотезы (addable experiments). На
// доме секции живут в pearl-плашке SheetCard; в `bare`-режиме — секцией с
// заголовком, без плашки.
//
// Array defaults are a safety net: a stale cache record (older shape) can reach
// here with observations/insights/hypotheses === undefined; default to [] so
// `.length` never throws even if the data boundary (hydrate/mapper) missed it.
const AnalysisResult = ({
  summary,
  observations = [],
  insights = [],
  hypotheses = [],
  insightSource = 'daily',
  showDays = true,
  bare = false,
  hideSectionHeaders = false,
  sheetHeader = '',
}: Props) => {
  // `sheetHeader` introduces the WHOLE result, not each section — so it rides
  // only the FIRST non-empty non-bare плашка. Computed up-front (not via a
  // render-time mutable flag — that's fragile under the React Compiler's
  // memoization): the section order is observations → insights → hypotheses, so
  // the first one with rows owns the header. Without this a non-bare caller with
  // 2+ non-empty sections would stack «Результат» 2–3× (one per SheetCard).
  // Today only DishAnalysisScreen is non-bare and it passes a single section, so
  // the guard is latent; it keeps a future multi-section caller honest.
  const firstSectionKey: 'observations' | 'insights' | 'hypotheses' | null =
    observations.length > 0
      ? 'observations'
      : insights.length > 0
        ? 'insights'
        : hypotheses.length > 0
          ? 'hypotheses'
          : null;

  const renderSection = (
    sectionKey: 'observations' | 'insights' | 'hypotheses',
    title: string,
    children: React.ReactNode,
  ) => {
    if (bare) {
      // `data-analysis-*` are stable styling hooks (the hashed module classes
      // can't be reached from a consumer's scss). The home «Открытия» slide
      // restyles these under `.ambientSheet` into the Apple type system; other
      // consumers (long modal / dish) are unaffected — they're not under it.
      return (
        <section className={styles.bareBlock} data-analysis-section="">
          {!hideSectionHeaders && (
            <Heading role="headline" as="h3" className={styles.bareHead}>
              {title}
            </Heading>
          )}
          <div className={styles.list} data-analysis-list="">
            {children}
          </div>
        </section>
      );
    }
    const header =
      sectionKey === firstSectionKey ? sheetHeader || undefined : undefined;
    return (
      <SheetCard header={header}>
        <div className={styles.list}>{children}</div>
      </SheetCard>
    );
  };

  return (
    <div className={styles.root} data-analysis-root="">
      {summary && (
        <div className={styles.summary} data-analysis-summary="">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}

      <div className={styles.sections} data-analysis-sections="">
        {observations.length > 0 &&
          renderSection(
            'observations',
            '',
            // Read-only reference: render through InsightCard with a neutral
            // valence (no sign/label) and action="none" (no «+ к себе»). An
            // observation is the insight shape minus valence, so we synthesise a
            // neutral one for display — never persisted.
            observations.map((observation, idx) => (
              <InsightCard
                key={idx}
                insight={{ ...observation, valence: 'neutral' }}
                showDays={showDays}
                action="none"
              />
            ))
          )}

        {insights.length > 0 &&
          renderSection(
            'insights',
            '',
            insights.map((insight, idx) => (
              <InsightCard
                key={idx}
                insight={insight}
                showDays={showDays}
                action="add"
                source={insightSource}
              />
            ))
          )}

        {hypotheses.length > 0 &&
          renderSection(
            'hypotheses',
            '',
            hypotheses.map((hypothesis, idx) => (
              <HypothesisCard key={idx} hypothesis={hypothesis} />
            ))
          )}
      </div>
    </div>
  );
};

export default memo(AnalysisResult);
