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
import {
  fetchDailyAnalysis,
  fetchWeeklyAnalysis,
  startDailyAnalysis,
  startWeeklyAnalysis,
  computeInputHash,
} from '@/entities/analytics';
import type { AnalyticsTab } from '@/entities/analytics';
import styles from './ScheduleFoodAnalyticsPage.module.scss';
import toaster from '@/shared/lib/toaster/toaster';

type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'done' | 'error' | 'stopped';

// ─── localStorage fallback for offline ───

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

// ─── Date helpers ───

function parseDate(dateStr: string): Date {
  const [d, m, y] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function getWeekDates(dateStr: string): { weekStart: string; dates: string[] } {
  const date = parseDate(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return { weekStart: dates[0], dates };
}

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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
  { value: 'week', alternativeLabel: 'Неделя' },
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
  const [text, setText] = useState('');
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [isStale, setIsStale] = useState(false);
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

  // Load persisted analysis on mount / tab change
  useEffect(() => {
    if (activeTab === 'week') return; // weekly has its own loading
    let cancelled = false;

    async function load() {
      const persisted = await fetchDailyAnalysis(date, activeTab);
      if (cancelled) return;

      if (persisted) {
        setText(persisted.content);
        setStatus('done');
        setCachedResult(date, activeTab, persisted.content);

        // Check staleness
        const foodSnap = buildFoodSnapshot(foods);
        const eventSnap = activeTab === 'day' ? buildEventSnapshot(events) : undefined;
        const currentHash = await computeInputHash(
          foodSnap.map((f) => ({ time: f.time, name: f.name, quantity: f.quantity, type: f.type })),
          eventSnap?.map((e) => ({ time: e.time, text: e.text })),
        );
        if (!cancelled) {
          setIsStale(currentHash !== persisted.inputHash);
        }
      } else {
        // Fallback to localStorage
        const cached = getCachedResult(date, activeTab);
        if (cached && !cancelled) {
          setText(cached);
          setStatus('done');
          setIsStale(true); // no server version, always consider stale
        } else if (!cancelled) {
          setText('');
          setStatus('idle');
          setIsStale(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [date, activeTab, foods, events]);

  // Load weekly analysis
  useEffect(() => {
    if (activeTab !== 'week') return;
    let cancelled = false;

    async function loadWeekly() {
      const { weekStart } = getWeekDates(date);
      const persisted = await fetchWeeklyAnalysis(weekStart);
      if (cancelled) return;

      if (persisted) {
        setText(persisted.content);
        setStatus('done');
        setCachedResult(date, 'week', persisted.content);
        setIsStale(false);
      } else {
        const cached = getCachedResult(date, 'week');
        if (cached && !cancelled) {
          setText(cached);
          setStatus('done');
          setIsStale(true);
        } else if (!cancelled) {
          setText('');
          setStatus('idle');
          setIsStale(false);
        }
      }
    }

    loadWeekly();
    return () => { cancelled = true; };
  }, [date, activeTab]);

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
    setIsStale(false);
    autoScrollRef.current = true;

    try {
      if (activeTab === 'week') {
        // Weekly analysis
        const { weekStart, dates } = getWeekDates(date);
        const result = await startWeeklyAnalysis(weekStart, dates, controller.signal);

        if (result.cached) {
          setText(result.content);
          setStatus('done');
          setCachedResult(date, 'week', result.content);
          return;
        }

        setStatus('streaming');
        let fullText = '';
        await readSSEStream(
          result.response,
          (chunk) => {
            fullText += chunk;
            setText((prev) => prev + chunk);
          },
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setStatus('done');
          setCachedResult(date, 'week', fullText);
        }
      } else {
        // Daily analysis
        const foodSnap = buildFoodSnapshot(foods);
        const eventSnap = buildEventSnapshot(events);
        const hashInput = foodSnap.map((f) => ({
          time: f.time, name: f.name, quantity: f.quantity, type: f.type,
        }));
        const hashEvents = activeTab === 'day'
          ? eventSnap.map((e) => ({ time: e.time, text: e.text }))
          : undefined;
        const inputHash = await computeInputHash(hashInput, hashEvents);

        const result = await startDailyAnalysis(
          date, activeTab, foodSnap, eventSnap, inputHash, controller.signal,
        );

        if (result.cached) {
          setText(result.content);
          setStatus('done');
          setCachedResult(date, activeTab, result.content);
          return;
        }

        setStatus('streaming');
        let fullText = '';
        await readSSEStream(
          result.response,
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
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setStatus('error');
      toaster.error(err instanceof Error ? err.message : 'Ошибка анализа');
    }
  }, [date, foods, events, activeTab]);

  const handleTabChange = useCallback(
    (tab: string) => {
      abortRef.current?.abort();
      setActiveTab(tab as AnalyticsTab);
      setText('');
      setStatus('idle');
      setIsStale(false);
    },
    [],
  );

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const remarkPlugins = useMemo(() => [remarkGfm], []);

  const hasFoods = foods.length > 0;
  const hasEvents = events.length > 0;
  const canAnalyze =
    activeTab === 'week'
      ? true // weekly always allows (server checks for daily analyses)
      : activeTab === 'food'
        ? hasFoods
        : hasFoods || hasEvents;

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
            <AddButton onClick={handleAnalyze}>
              {isStale ? 'Обновить' : 'Анализ'}
            </AddButton>
          )
        ) : undefined
      }
    >
      <div className={styles.container}>
        {/* Stale indicator */}
        {isStale && status === 'done' && hasContent && (
          <div className={styles.staleBanner}>
            Данные изменились с момента анализа.{' '}
            <button className={styles.retryLink} onClick={handleAnalyze}>
              Обновить
            </button>
          </div>
        )}

        {/* Toolbar — copy when done */}
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
            {activeTab === 'week'
              ? 'Нажмите «Анализ» для недельного обзора.'
              : canAnalyze
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

  const scheduleFoods = useScheduleFoods(date);
  const scheduleEvents = useScheduleEvents(date);

  useEffect(() => {
    if (!date) {
      navigate(RouterLinks.ScheduleDateSelection);
    }
  }, [date]);

  if (!date) return null;

  return <AnalyticsContent date={date} foods={[...scheduleFoods] as ScheduleFoodWithRelations[]} events={[...scheduleEvents] as ScheduleEvent[]} />;
};

export default GetDatePageWrapper;
