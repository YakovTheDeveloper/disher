import { RouterLinks } from '@/app/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Screen } from '@/shared/ui/Screen';
import { ScreenLabel } from '@/shared/ui/atoms/Typography/ScreenLabel';
import { AddButton } from '@/shared/ui/atoms/Button';
import { Tabs, type Tab } from '@/shared/ui/Tabs';
import { useScheduleFoods } from '@/entities/schedule-food/api/queries';
import { useScheduleEvents } from '@/entities/schedule-event/api/queries';
import type { ScheduleFoodWithRelations } from '@/entities/schedule-food/model/types';
import type { ScheduleEvent } from '@/entities/schedule-event/model/types';
import styles from './ScheduleFoodAnalyticsPage.module.scss';
import toaster from '@/shared/lib/toaster/toaster';

const port = Number(import.meta.env.VITE_PORT) || 3000;
const API_BASE = `http://${window.location.hostname}:${port}`;

type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'done' | 'error' | 'stopped';
type AnalyticsTab = 'food' | 'day';

// ─── Local cache ───

const CACHE_KEY_PREFIX = 'analytics_cache_';

function getCacheKey(date: string, tab: AnalyticsTab): string {
  return `${CACHE_KEY_PREFIX}${date}_${tab}`;
}

function getCachedResult(date: string, tab: AnalyticsTab): string | null {
  try {
    return localStorage.getItem(getCacheKey(date, tab));
  } catch {
    return null;
  }
}

function setCachedResult(date: string, tab: AnalyticsTab, text: string): void {
  try {
    localStorage.setItem(getCacheKey(date, tab), text);
  } catch {
    // localStorage full or unavailable
  }
}

// ─── Snapshot builders ───

function buildFoodSnapshot(foods: ScheduleFoodWithRelations[]) {
  return foods.map((sf) => ({
    time: sf.time,
    type: sf.type as 'food' | 'dish',
    name: sf.food?.name || sf.dish?.name || 'Неизвестно',
    quantity: sf.quantity,
  }));
}

function buildEventSnapshot(events: ScheduleEvent[]) {
  return events.map((ev) => ({
    time: ev.time,
    text: ev.text,
    atoms: Array.isArray(ev.atoms) ? ev.atoms : [],
  }));
}

// ─── SSE reader ───

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

// ─── UI components ───

const ThinkingIndicator = () => (
  <div className={styles.thinking}>
    <span className={styles.thinkingDot} />
    <span className={styles.thinkingDot} />
    <span className={styles.thinkingDot} />
  </div>
);

const TABS: Tab[] = [
  { value: 'food', alternativeLabel: 'Питание' },
  { value: 'day', alternativeLabel: 'День' },
];

// ─── Main page ───

const AnalyticsContent = ({
  date,
  foods,
  events,
}: {
  date: string;
  foods: ScheduleFoodWithRelations[];
  events: ScheduleEvent[];
}) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('food');
  const [text, setText] = useState(() => getCachedResult(date, 'food') || '');
  const [status, setStatus] = useState<StreamStatus>(() =>
    getCachedResult(date, 'food') ? 'done' : 'idle',
  );
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

    const isDay = activeTab === 'day';
    const endpoint = isDay ? 'analyze-day-stream' : 'analyze-stream';
    const body = isDay
      ? { date, foods: buildFoodSnapshot(foods), events: buildEventSnapshot(events) }
      : { date, foods: buildFoodSnapshot(foods) };

    try {
      const response = await fetch(`${API_BASE}/api/analytics/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const respBody = await response.text().catch(() => '');
        throw new Error(
          response.status === 400
            ? 'Некорректные данные'
            : response.status >= 500
              ? 'Сервер временно недоступен'
              : `Ошибка: ${response.status} ${respBody}`,
        );
      }

      setStatus('streaming');

      let fullText = '';
      await readSSEStream(
        response,
        (chunk) => {
          fullText += chunk;
          setText((prev) => prev + chunk);
        },
        controller.signal,
      );

      if (!controller.signal.aborted) {
        setStatus('done');
        setCachedResult(date, activeTab, fullText);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setStatus('error');
      toaster.error(err instanceof Error ? err.message : 'Ошибка анализа');
    }
  }, [date, foods, events, activeTab]);

  // On tab switch, load cached result or show idle
  const handleTabChange = useCallback(
    (tab: string) => {
      abortRef.current?.abort();
      const newTab = tab as AnalyticsTab;
      setActiveTab(newTab);

      const cached = getCachedResult(date, newTab);
      if (cached) {
        setText(cached);
        setStatus('done');
      } else {
        setText('');
        setStatus('idle');
      }
    },
    [date],
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const remarkPlugins = useMemo(() => [remarkGfm], []);

  const hasFoods = foods.length > 0;
  const hasEvents = events.length > 0;
  const canAnalyze =
    activeTab === 'food' ? hasFoods : hasFoods || hasEvents;

  return (
    <Screen
      offsetTop
      title={<ScreenLabel variant="screenHeader">Аналитика</ScreenLabel>}
      topPanel={
        <div className={styles.tabsWrapper}>
          <Tabs tabs={TABS} current={activeTab} setTab={handleTabChange} />
        </div>
      }
      bottomRight={
        canAnalyze ? (
          isActive ? (
            <AddButton onClick={handleStop}>Отменить</AddButton>
          ) : (
            <AddButton onClick={handleAnalyze}>Анализ</AddButton>
          )
        ) : undefined
      }
    >
      <div className={styles.container}>
        {/* Toolbar — copy / retry when done */}
        {!isActive && status === 'done' && hasContent && (
          <div className={styles.toolbar}>
            <button
              className={styles.toolbarBtn}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text);
                  toaster.success('Скопировано');
                } catch {
                  const textarea = document.createElement('textarea');
                  textarea.value = text;
                  textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
                  document.body.appendChild(textarea);
                  textarea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textarea);
                  toaster.success('Скопировано');
                }
              }}
            >
              Копировать
            </button>
          </div>
        )}

        {/* Connecting — thinking dots */}
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
            <button className={styles.retryLink} onClick={handleAnalyze}>
              Попробовать снова
            </button>
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
            {canAnalyze
              ? 'Нажмите кнопку «Анализ» для начала.'
              : activeTab === 'food'
                ? 'Нет данных для анализа. Добавьте продукты в расписание.'
                : 'Нет данных для анализа. Добавьте продукты или события.'}
          </div>
        )}
      </div>
    </Screen>
  );
};

// ─── Wrapper — fetches Triplit data ───

const GetDatePageWrapper = () => {
  const params = useParams();
  const date = params.id;
  const navigate = useNavigate();

  const { results: scheduleFoods } = useScheduleFoods(date);
  const { results: scheduleEvents } = useScheduleEvents(date);

  useEffect(() => {
    if (!date) {
      navigate(RouterLinks.ScheduleDateSelection);
    }
  }, [date]);

  if (!date) return null;

  const foods = scheduleFoods ? Array.from(scheduleFoods.values()) : [];
  const events = scheduleEvents ? Array.from(scheduleEvents.values()) : [];

  return <AnalyticsContent date={date} foods={foods} events={events} />;
};

export default GetDatePageWrapper;
