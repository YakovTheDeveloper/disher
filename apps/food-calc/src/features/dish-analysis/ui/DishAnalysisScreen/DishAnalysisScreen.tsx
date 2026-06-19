import { useCallback, useEffect, useRef, useState } from 'react';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { AnalysisResult } from '@/features/analysis/AnalysisResult';
import { FabricLoader } from '@/features/analysis/FabricLoader';
import Button from '@/shared/ui/atoms/Button/Button';
import { useDishAnalysis } from '../../api/queries';
import { runDishAnalysis, type DishAnalysisResult } from '../../api/runDishAnalysis';
import styles from './DishAnalysisScreen.module.scss';

type Props = {
  dishId: string;
  hasIngredients: boolean;
};

type Status = 'idle' | 'loading' | 'done' | 'error';

// One screen, one piece of derived state per dish:
//   - idb-keyval holds the latest persisted разбор ({summary, insights})
//   - the in-flight request lives in this component (never persisted mid-run)
// Re-run = abort current request (if any) + new POST + overwrite idb-keyval.
// Result rendered by the shared AnalysisResult (same as daily/long); dish has no
// hypotheses, and its insights ground in ingredients (showDays=false).
const DishAnalysisScreen = ({ dishId, hasIngredients }: Props) => {
  const isOnline = useOnline();
  const { data: persisted, isLoading } = useDishAnalysis(dishId);

  const [result, setResult] = useState<DishAnalysisResult | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const runForDishRef = useRef<string | null>(null);

  useEffect(() => {
    // Switching to a different dish — abort and reset.
    if (runForDishRef.current && runForDishRef.current !== dishId) {
      abortRef.current?.abort();
      abortRef.current = null;
      setResult(null);
      setStatus('idle');
      setError(null);
      runForDishRef.current = null;
    }
  }, [dishId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleRun = useCallback(async () => {
    if (status === 'loading') return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    runForDishRef.current = dishId;

    setResult(null);
    setError(null);
    setStatus('loading');

    try {
      const res = await runDishAnalysis({ dishId, signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setResult(res);
      setStatus('done');
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [dishId, status]);

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.streamingHeader}>
          <span>Загрузка…</span>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={styles.root}>
        <FabricLoader art="/art/loader-analysis.png" caption="Разбираем блюдо" />
      </div>
    );
  }

  // Prefer the just-run result, else the persisted one.
  const shown =
    status === 'done' && result
      ? result
      : persisted
        ? { summary: persisted.summary, insights: persisted.insights }
        : null;
  const hasContent = Boolean(shown && (shown.summary || shown.insights.length > 0));

  if (!hasContent && status !== 'error') {
    return (
      <div className={styles.emptyHero}>
        <p className={styles.emptyTitle}>Разбор блюда</p>
        <p className={styles.emptyHint}>
          AI прочитает рецепт и расскажет про профиль БЖУ, гликемическое
          ощущение, для каких целей блюдо подходит, плюс отметит удачные и
          неудачные связки нутриентов.
        </p>
        <Button
          variant="brand"
          onClick={handleRun}
          disabled={!isOnline || !hasIngredients}
        >
          Проанализировать
        </Button>
        {!hasIngredients && (
          <p className={styles.disabledHint}>
            Добавьте хотя бы один ингредиент.
          </p>
        )}
        {!isOnline && (
          <p className={styles.disabledHint}>
            Нет сети — разбор требует подключения.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {error && <div className={styles.error}>{error}</div>}
      {hasContent && shown && (
        <AnalysisResult
          summary={shown.summary}
          observations={[]}
          insights={shown.insights}
          hypotheses={[]}
          insightSource="dish"
          showDays={false}
        />
      )}
      <Button
        variant="brand"
        className={styles.rerunSlot}
        onClick={handleRun}
        disabled={!isOnline || !hasIngredients}
      >
        {status === 'error' ? 'Повторить' : 'Перезапустить разбор'}
      </Button>
    </div>
  );
};

export default DishAnalysisScreen;
