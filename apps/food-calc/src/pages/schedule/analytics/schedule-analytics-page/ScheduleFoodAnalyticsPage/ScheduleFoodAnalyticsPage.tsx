import { RouterLinks } from '@/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { Button } from '@/components/ui/atoms/Button';
import styles from './ScheduleFoodAnalyticsPage.module.scss';
// TODO: migrate to Triplit — useFoodScheduleStore removed
const useFoodScheduleStore = () => null as any;
import toaster from '@/infrastructure/toaster/toaster';

const port = Number(import.meta.env.VITE_PORT) || 3000;
const API_BASE = `http://${window.location.hostname}:${port}`;

type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'done' | 'error' | 'stopped';

function buildSnapshot(scheduleFood: any) {
  // TODO: adapt snapshot building for Triplit entities
  return {
    id: scheduleFood.id,
    foods: (scheduleFood.foods?.items ?? []).map((item: any) => ({
      id: item.id,
      time: item.time,
      contentProduct: item.contentProduct
        ? {
            foodId: item.contentProduct.foodId,
            variant: 'product' as const,
            quantity: item.contentProduct.quantity,
          }
        : null,
      contentDish: item.contentDish
        ? {
            dishId: item.contentDish.dishId,
            variant: 'dish' as const,
            quantity: item.contentDish.quantity,
          }
        : null,
    })),
  };
}

async function readSSEStream(
  response: Response,
  onChunk: (chunk: string) => void,
  signal: AbortSignal,
) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal.aborted) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('event: error')) {
          const nextDataLine = lines.find((l) => l.trim().startsWith('data: '));
          if (nextDataLine) {
            throw new Error(JSON.parse(nextDataLine.trim().slice(6)));
          }
          throw new Error('Ошибка сервера');
        }

        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          onChunk(JSON.parse(data));
        } catch {
          // skip malformed
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

const ThinkingIndicator = () => (
  <div className={styles.thinking}>
    <span className={styles.thinkingDot} />
    <span className={styles.thinkingDot} />
    <span className={styles.thinkingDot} />
  </div>
);

const Page = ({ scheduleFood }: { scheduleFood: any }) => {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<StreamStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  const isActive = status === 'connecting' || status === 'streaming';
  const hasContent = text.length > 0;

  // Auto-scroll while streaming
  useEffect(() => {
    if (!isActive || !autoScrollRef.current) return;
    const el = resultRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [text, isActive]);

  // Disable auto-scroll if user scrolls up
  useEffect(() => {
    const el = resultRef.current;
    if (!el) return;

    const handleScroll = () => {
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      autoScrollRef.current = isAtBottom;
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setStatus('stopped');
  }, []);

  const handleAnalyze = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('connecting');
    setText('');
    autoScrollRef.current = true;

    try {
      const response = await fetch(`${API_BASE}/api/analytics/analyze-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: buildSnapshot(scheduleFood) }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(
          response.status === 400
            ? 'Некорректные данные расписания'
            : response.status >= 500
              ? 'Сервер временно недоступен'
              : `Ошибка: ${response.status} ${body}`,
        );
      }

      setStatus('streaming');

      await readSSEStream(
        response,
        (chunk) => setText((prev) => prev + chunk),
        controller.signal,
      );

      if (!controller.signal.aborted) {
        setStatus('done');
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setStatus('error');
      setText((prev) => prev); // preserve partial text
      toaster.error(err instanceof Error ? err.message : 'Ошибка анализа');
    }
  }, [scheduleFood]);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toaster.success('Скопировано');
    } catch {
      // Fallback for iOS Safari
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toaster.success('Скопировано');
    }
  }, [text]);

  useEffect(() => {
    if (scheduleFood.foods?.items?.length > 0) {
      handleAnalyze();
    }
    return () => abortRef.current?.abort();
  }, [scheduleFood]);

  const remarkPlugins = useMemo(() => [remarkGfm], []);

  return (
    <Screen offsetTop title={<ScreenLabel variant="screenHeader">Аналитика питания</ScreenLabel>}>
      <div className={styles.container}>
        {/* Toolbar */}
        {(hasContent || isActive) && (
          <div className={styles.toolbar}>
            {isActive && (
              <Button variant="ghost" onClick={handleStop}>
                Остановить
              </Button>
            )}
            {!isActive && hasContent && (
              <>
                <Button variant="ghost" onClick={handleCopy}>
                  Копировать
                </Button>
                <Button variant="ghost" onClick={handleAnalyze}>
                  Повторить
                </Button>
              </>
            )}
          </div>
        )}

        {/* Connecting state -- thinking dots */}
        {status === 'connecting' && <ThinkingIndicator />}

        {/* Streaming / completed result */}
        {hasContent && (
          <div className={styles.result} ref={resultRef}>
            <div className={styles.markdown}>
              <ReactMarkdown remarkPlugins={remarkPlugins}>{text}</ReactMarkdown>
            </div>
            {status === 'streaming' && <span className={styles.cursor} />}
          </div>
        )}

        {/* Error with retry */}
        {status === 'error' && !hasContent && (
          <div className={styles.error}>
            <p>Не удалось получить анализ</p>
            <Button variant="ghost" onClick={handleAnalyze}>
              Попробовать снова
            </Button>
          </div>
        )}

        {/* Partial result error banner */}
        {status === 'error' && hasContent && (
          <div className={styles.errorBanner}>
            Генерация прервана из-за ошибки.{' '}
            <button className={styles.retryLink} onClick={handleAnalyze}>
              Повторить
            </button>
          </div>
        )}

        {/* Stopped banner */}
        {status === 'stopped' && hasContent && (
          <div className={styles.stoppedBanner}>
            Генерация остановлена.{' '}
            <button className={styles.retryLink} onClick={handleAnalyze}>
              Начать заново
            </button>
          </div>
        )}

        {/* Empty state */}
        {status === 'idle' && !hasContent && (
          <div className={styles.empty}>
            Нет данных для анализа. Добавьте продукты в расписание.
          </div>
        )}
      </div>
    </Screen>
  );
};

const GetDatePageWrapper = () => {
  const params = useParams();
  const date = params.id;
  const navigate = useNavigate();

  const scheduleFoodStore = useFoodScheduleStore();

  const foodSchedule = scheduleFoodStore.getLocal(date || '');

  useEffect(() => {
    if (!date) {
      navigate(RouterLinks.ScheduleDateSelection);
    }
  }, [date]);

  if (!foodSchedule) return null;
  if (!date) return null;

  return <Page scheduleFood={foodSchedule} />;
};

export default GetDatePageWrapper;
