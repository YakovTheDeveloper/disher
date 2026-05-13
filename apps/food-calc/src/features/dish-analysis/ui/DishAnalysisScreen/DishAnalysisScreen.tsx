import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useDishAnalysis } from '../../api/queries';
import { runDishAnalysis } from '../../api/runDishAnalysis';
import styles from './DishAnalysisScreen.module.scss';

type Props = {
  dishId: string;
  hasIngredients: boolean;
};

type Status = 'idle' | 'streaming' | 'done' | 'error';

// One screen, one piece of derived state per dish:
//   - idb-keyval holds the latest persisted resultMd
//   - streaming state lives in this component (never persisted mid-stream)
// Re-run = abort current stream (if any) + new POST + overwrite idb-keyval.
const DishAnalysisScreen = ({ dishId, hasIngredients }: Props) => {
  const isOnline = useOnline();
  const { data: persisted, isLoading } = useDishAnalysis(dishId);

  const [streamText, setStreamText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const streamForDishRef = useRef<string | null>(null);

  useEffect(() => {
    // Switching to a different dish — abort and reset.
    if (streamForDishRef.current && streamForDishRef.current !== dishId) {
      abortRef.current?.abort();
      abortRef.current = null;
      setStreamText('');
      setStatus('idle');
      setError(null);
      streamForDishRef.current = null;
    }
  }, [dishId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleRun = useCallback(async () => {
    if (status === 'streaming') return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    streamForDishRef.current = dishId;

    setStreamText('');
    setError(null);
    setStatus('streaming');

    try {
      await runDishAnalysis({
        dishId,
        signal: ctrl.signal,
        onChunk: (chunk) => {
          if (ctrl.signal.aborted) return;
          setStreamText((s) => s + chunk);
        },
      });
      if (!ctrl.signal.aborted) setStatus('done');
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

  const isStreaming = status === 'streaming';
  // Prefer live stream text while streaming, else persisted result.
  const displayedMd =
    isStreaming || status === 'done'
      ? streamText
      : (persisted?.resultMd ?? '');

  const hasContent = displayedMd.length > 0;

  if (!hasContent && !isStreaming && status !== 'error') {
    return (
      <div className={styles.emptyHero}>
        <p className={styles.emptyTitle}>Разбор блюда</p>
        <p className={styles.emptyHint}>
          AI прочитает рецепт и расскажет про профиль БЖУ, гликемическое
          ощущение, для каких целей блюдо подходит и что можно улучшить.
        </p>
        <button
          type="button"
          className={styles.runButton}
          onClick={handleRun}
          disabled={!isOnline || !hasIngredients}
        >
          Проанализировать
        </button>
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
      {isStreaming && (
        <div className={styles.streamingHeader}>
          <span>Разбираем</span>
          <span className={styles.thinkingDots}>
            <span />
            <span />
            <span />
          </span>
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}
      {hasContent && (
        <div className={styles.markdown}>
          <ReactMarkdown>{displayedMd}</ReactMarkdown>
        </div>
      )}
      {!isStreaming && (
        <button
          type="button"
          className={styles.rerunButton}
          onClick={handleRun}
          disabled={!isOnline || !hasIngredients}
        >
          {status === 'error' ? 'Повторить' : 'Перезапустить разбор'}
        </button>
      )}
    </div>
  );
};

export default DishAnalysisScreen;
