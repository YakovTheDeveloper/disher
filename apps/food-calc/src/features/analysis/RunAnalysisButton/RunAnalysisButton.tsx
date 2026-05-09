import { useCallback, useEffect, useRef, useState } from 'react';
import { format, parse, subDays } from 'date-fns';
import { modalStore } from '@/shared/ui';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useActiveHypotheses } from '@/entities/hypothesis';
import { AnalysisResultModal } from '../AnalysisResultModal';
import {
  startAnalysis,
  useAnalysis,
  isPendingAnalysis,
  isFailedAnalysis,
} from '../api';
import styles from './RunAnalysisButton.module.scss';

type Props = {
  className?: string;
  label?: string;
  /** Anchor date in dd-MM-yyyy. Window is anchor−(days−1) … anchor. */
  date: string;
  days?: number;
  disabled?: boolean;
  disabledHint?: string;
};

function buildDayKeys(date: string, days: number): string[] {
  const anchor = parse(date, 'dd-MM-yyyy', new Date());
  if (Number.isNaN(anchor.getTime())) return [];
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    out.push(format(subDays(anchor, i), 'dd-MM-yyyy'));
  }
  return out;
}

function dayWindowIso(date: string, days: number): { start: string; end: string } {
  const anchor = parse(date, 'dd-MM-yyyy', new Date());
  if (Number.isNaN(anchor.getTime())) {
    const now = new Date().toISOString();
    return { start: now, end: now };
  }
  const end = new Date(anchor);
  end.setHours(23, 59, 59, 999);
  const start = subDays(anchor, days - 1);
  start.setHours(0, 0, 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

const RunAnalysisButton = ({
  className,
  label = 'Разобрать',
  date,
  days = 7,
  disabled,
  disabledHint,
}: Props) => {
  const isOnline = useOnline();
  const activeHypotheses = useActiveHypotheses();
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shownForRef = useRef<string | null>(null);

  const { data: analysis } = useAnalysis(analysisId ?? undefined);

  useEffect(() => {
    if (!analysis || !analysisId) return;
    if (shownForRef.current === analysisId) return;
    if (isPendingAnalysis(analysis)) return;
    shownForRef.current = analysisId;
    setAnalysisId(null);
    if (isFailedAnalysis(analysis)) {
      setError(analysis.resultMd || 'Разбор не получился, попробуй ещё раз');
    } else {
      void modalStore.show(AnalysisResultModal, {
        analysisId: analysis.id,
        resultMd: analysis.resultMd,
        ideaCards: analysis.ideaCards,
      });
    }
  }, [analysis, analysisId]);

  const running = analysis ? isPendingAnalysis(analysis) : analysisId !== null;
  const finalDisabled = disabled || !isOnline || running;
  const finalHint = !isOnline
    ? 'Нет сети — разбор требует подключения'
    : disabled
      ? disabledHint
      : undefined;

  const handleClick = useCallback(async () => {
    if (running) return;
    setError(null);
    try {
      const dayKeys = buildDayKeys(date, days);
      const { start, end } = dayWindowIso(date, days);

      const hypothesesContext = activeHypotheses
        .filter((h) => !!h.startedAt)
        .map((h) => ({
          title: h.title,
          body: h.body,
          ...(h.days != null ? { days: h.days } : {}),
          startedAt: h.startedAt!,
        }));

      const started = await startAnalysis({
        windowStart: start,
        windowEnd: end,
        dayKeys,
        ...(hypothesesContext.length > 0 ? { hypotheses: hypothesesContext } : {}),
      });
      setAnalysisId(started.analysisId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не получилось');
    }
  }, [running, date, days, activeHypotheses]);

  return (
    <>
      <button
        type="button"
        className={[styles.button, className].filter(Boolean).join(' ')}
        onClick={handleClick}
        disabled={finalDisabled}
        title={finalHint}
        aria-label={label}
      >
        {running && <span className={styles.spinner} />}
        {running ? 'Разбираем…' : label}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </>
  );
};

export default RunAnalysisButton;
