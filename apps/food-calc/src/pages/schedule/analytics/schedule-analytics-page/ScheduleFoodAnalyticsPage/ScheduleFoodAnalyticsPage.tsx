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
  getCachedAnalysis,
  setCachedAnalysis,
  AnalyticsAuthError,
} from '@/entities/analytics';
import type { AnalyticsTab } from '@/entities/analytics';
import { useUserId } from '@/shared/lib/auth/useUserId';
import { useAuthStore } from '@/features/auth/auth-store';
import styles from './ScheduleFoodAnalyticsPage.module.scss';
import toaster from '@/shared/lib/toaster/toaster';

type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'done' | 'error' | 'stopped';

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

// ─── Snapshot builders ───

function buildFoodSnapshot(foods: ScheduleFoodWithRelations[]) {
  return foods.map((sf) => ({
    time: sf.time,
    type: sf.type as 'food' | 'dish',
    name: sf.product?.name || sf.dish?.name || 'Неизвестно',
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

function parseSSELines(
  lines: string[],
  onChunk: (chunk: string) => void,
): boolean {
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
    if (data === '[DONE]') return true;

    try {
      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) onChunk(content);
    } catch {
      // skip malformed
    }
  }
  return false;
}

async function readSSEStream(
  response: Response,
  onChunk: (chunk: string) => void,
  signal: AbortSignal,
) {
  // iOS Safari may not support ReadableStream on fetch responses — fall back to text()
  if (!response.body) {
    const text = await response.text();
    if (signal.aborted) return;
    const lines = text.split('\n');
    parseSSELines(lines, onChunk);
    return;
  }

  const reader = response.body.getReader();
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

      const isDone = parseSSELines(lines, onChunk);
      if (isDone) return;
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
  userId,
  foods,
  events,
}: {
  date: string;
  userId: string;
  foods: ScheduleFoodWithRelations[];
  events: ScheduleEvent[];
}) => {
  const signOut = useAuthStore((s) => s.signOut);
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
    const dailyTab: 'food' | 'day' = activeTab;
    let cancelled = false;

    async function load() {
      let persisted;
      try {
        persisted = await fetchDailyAnalysis(date, dailyTab);
      } catch (err) {
        if (err instanceof AnalyticsAuthError) {
          await signOut();
        }
        return;
      }
      if (cancelled) return;

      if (persisted) {
        setText(persisted.content);
        setStatus('done');
        setCachedAnalysis(userId, date, activeTab, persisted.content);

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
        const cached = getCachedAnalysis(userId, date, activeTab);
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
  }, [date, activeTab, foods, events, userId, signOut]);

  // Load weekly analysis
  useEffect(() => {
    if (activeTab !== 'week') return;
    let cancelled = false;

    async function loadWeekly() {
      const { weekStart } = getWeekDates(date);
      let persisted;
      try {
        persisted = await fetchWeeklyAnalysis(weekStart);
      } catch (err) {
        if (err instanceof AnalyticsAuthError) {
          await signOut();
        }
        return;
      }
      if (cancelled) return;

      if (persisted) {
        setText(persisted.content);
        setStatus('done');
        setCachedAnalysis(userId, date, 'week', persisted.content);
        setIsStale(false);
      } else {
        const cached = getCachedAnalysis(userId, date, 'week');
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
  }, [date, activeTab, userId, signOut]);

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
          setCachedAnalysis(userId, date, 'week', result.content);
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
          setCachedAnalysis(userId, date, 'week', fullText);
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
          setCachedAnalysis(userId, date, activeTab, result.content);
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
          setCachedAnalysis(userId, date, activeTab, fullText);
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      if (err instanceof AnalyticsAuthError) {
        await signOut();
        return;
      }
      setStatus('error');
      toaster.error(err instanceof Error ? err.message : 'Ошибка анализа');
    }
  }, [date, foods, events, activeTab, userId, signOut]);

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

// ─── Wrapper — fetches data ───

const GetDatePageWrapper = () => {
  const params = useParams();
  const date = params.id;
  const navigate = useNavigate();
  const userId = useUserId();

  const scheduleFoods = useScheduleFoods(date);
  const scheduleEvents = useScheduleEvents(date);

  useEffect(() => {
    if (!date) {
      navigate(RouterLinks.ScheduleDateSelection);
    }
  }, [date]);

  if (!date || !userId) return null;

  return (
    <AnalyticsContent
      date={date}
      userId={userId}
      foods={scheduleFoods}
      events={[...scheduleEvents] as ScheduleEvent[]}
    />
  );
};

export default GetDatePageWrapper;
