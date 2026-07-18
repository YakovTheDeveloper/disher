import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseFreeTextEvent, type ParseEventsResponse } from '../api/parseFreeTextEvent';
import { db } from '@/shared/lib/dexie/schema';
import { addScheduleEvent } from '@/entities/schedule-event';
import type { Atom } from '@/entities/schedule-event/model/atoms';
import { useUserId } from '@/shared/lib/auth/useUserId';
import { safeMutate } from '@/shared/lib/safeMutate';
import { markAdded } from '@/shared/model/recentlyAddedStore';
import { scrollToNewRow } from '@/features/food/food-entry-flow/scrollToNewRow';
import { useHaptic } from '@/shared/lib/hooks/useHaptic';
import toaster from '@/shared/lib/toaster/toaster';
import { classifyError, defaultUserMessage } from '@/shared/lib/errors/classify';

export type WriteEventFlowState = 'idle' | 'loading' | 'ready' | 'error';

export interface EventAspectDraft {
  label: string;
  value: number;
}

// In-memory review row: an LLM-parsed event the user can edit/toggle before commit.
// Single bucket — событий нет каталога, разбор и есть финальная структура.
export interface EventReviewRow {
  uid: string;
  enabled: boolean;
  text: string;
  timeStart: string | null;
  timeEnd: string | null;
  aspects: EventAspectDraft[];
}

export interface UseWriteEventFlowResult {
  state: WriteEventFlowState;
  inputText: string;
  errorMessage: string | null;
  setInputText: (text: string) => void;
  submit: (text: string) => void;
  retry: () => void;
  cancel: () => void;

  events: EventReviewRow[];
  totalToAdd: number;
  isSubmitting: boolean;
  toggleEvent: (uid: string) => void;
  updateEvent: (uid: string, patch: Partial<Omit<EventReviewRow, 'uid' | 'aspects'>>) => void;
  updateAspect: (uid: string, index: number, patch: Partial<EventAspectDraft>) => void;
  removeAspect: (uid: string, index: number) => void;
  commit: () => Promise<boolean>;
}

const PARSE_TIMEOUT_MS = 35_000;

function makeRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const makeUid = () => Math.random().toString(36).slice(2, 10);
const nowHHMM = () => new Date().toTimeString().slice(0, 5);
const clampValue = (v: number) => Math.max(0, Math.min(10, Math.round(v)));

// Ряд что-то коммитит, только если после правок остался текст ИЛИ хоть один
// аспект с непустым label (та же логика, что офлайн-форма: линейка без имени —
// не событие).
function rowIsCommittable(row: EventReviewRow): boolean {
  return row.enabled && (row.text.trim().length > 0 || row.aspects.some((a) => a.label.trim().length > 0));
}

export function useWriteEventFlow(scheduleId: string): UseWriteEventFlowResult {
  const userId = useUserId();
  const haptic = useHaptic();

  const [state, setState] = useState<WriteEventFlowState>('idle');
  const [inputText, setInputText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<EventReviewRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  // Последний (requestId, text) — чтобы retry той же строки переиспользовал id и
  // не спровоцировал второе списание, если первый запрос уже дошёл до сервера.
  const lastRequestIdRef = useRef<string | null>(null);
  const lastTextRef = useRef<string>('');

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const abortActive = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    activeRequestIdRef.current = null;
    clearTimer();
  }, [clearTimer]);

  const resetAll = useCallback(() => {
    setState('idle');
    setInputText('');
    setErrorMessage(null);
    setEvents([]);
  }, []);

  // Смена дня сбрасывает разбор (бар — синглтон поверх дневного пейджера).
  useEffect(() => {
    abortActive();
    resetAll();
  }, [scheduleId, abortActive, resetAll]);

  // Abort in-flight fetch on unmount.
  useEffect(() => () => abortActive(), [abortActive]);

  const applyResponse = useCallback((response: ParseEventsResponse) => {
    setEvents(
      response.events.map((e) => ({
        uid: makeUid(),
        enabled: true,
        text: e.text,
        timeStart: e.timeStart,
        timeEnd: e.timeEnd,
        aspects: e.aspects.map((a) => ({ label: a.label, value: clampValue(a.value) })),
      })),
    );
  }, []);

  const startFetch = useCallback(
    (text: string, requestId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      activeRequestIdRef.current = requestId;
      lastRequestIdRef.current = requestId;
      lastTextRef.current = text;

      clearTimer();
      timeoutRef.current = setTimeout(() => {
        if (activeRequestIdRef.current !== requestId) return;
        controller.abort();
        setState('error');
        setErrorMessage('Не дождались ответа. Попробуйте ещё раз.');
        toaster.error('Не дождались ответа. Попробуйте ещё раз.', {
          kind: { kind: 'timeout', message: 'parse timeout', raw: null },
        });
      }, PARSE_TIMEOUT_MS);

      parseFreeTextEvent(text, requestId, controller.signal).then(
        (response) => {
          if (controller.signal.aborted || activeRequestIdRef.current !== requestId) return;
          clearTimer();
          applyResponse(response);
          setInputText('');
          setErrorMessage(null);
          setState('ready');
        },
        (err: unknown) => {
          if (controller.signal.aborted || activeRequestIdRef.current !== requestId) return;
          clearTimer();
          const kind = classifyError(err);
          const message = defaultUserMessage(kind);
          setErrorMessage(message);
          setState('error');
          toaster.error(message, { kind });
        },
      );
    },
    [applyResponse, clearTimer],
  );

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      abortActive();
      setInputText(trimmed);
      setErrorMessage(null);
      setEvents([]);
      setState('loading');
      startFetch(trimmed, makeRequestId());
    },
    [abortActive, startFetch],
  );

  const retry = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setState('idle');
      return;
    }
    abortActive();
    // Та же строка → переиспользуем прошлый requestId (дедуп списания).
    const reuse = lastTextRef.current === trimmed ? lastRequestIdRef.current : null;
    setErrorMessage(null);
    setEvents([]);
    setState('loading');
    startFetch(trimmed, reuse ?? makeRequestId());
  }, [inputText, abortActive, startFetch]);

  const cancel = useCallback(() => {
    abortActive();
    resetAll();
  }, [abortActive, resetAll]);

  const toggleEvent = useCallback((uid: string) => {
    setEvents((prev) => prev.map((e) => (e.uid === uid ? { ...e, enabled: !e.enabled } : e)));
  }, []);

  const updateEvent = useCallback(
    (uid: string, patch: Partial<Omit<EventReviewRow, 'uid' | 'aspects'>>) => {
      setEvents((prev) => prev.map((e) => (e.uid === uid ? { ...e, ...patch } : e)));
    },
    [],
  );

  const updateAspect = useCallback((uid: string, index: number, patch: Partial<EventAspectDraft>) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.uid === uid
          ? { ...e, aspects: e.aspects.map((a, i) => (i === index ? { ...a, ...patch } : a)) }
          : e,
      ),
    );
  }, []);

  const removeAspect = useCallback((uid: string, index: number) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.uid === uid ? { ...e, aspects: e.aspects.filter((_, i) => i !== index) } : e,
      ),
    );
  }, []);

  const committable = useMemo(() => events.filter(rowIsCommittable), [events]);
  const totalToAdd = committable.length;

  const commit = useCallback(async (): Promise<boolean> => {
    if (isSubmitting || totalToAdd === 0) return false;
    if (!userId) {
      toaster.error('Не авторизованы');
      return false;
    }
    setIsSubmitting(true);

    const newIds = committable.map(() => crypto.randomUUID());
    markAdded(newIds);
    if (newIds[0]) scrollToNewRow(newIds[0]);

    const result = await safeMutate(
      () =>
        db.transaction('rw', db.schedule_events, async () => {
          for (const [i, row] of committable.entries()) {
            const atoms: Atom[] = row.aspects
              .filter((a) => a.label.trim().length > 0)
              .map((a) => ({ kind: 'scale', value: clampValue(a.value), label: a.label.trim() }));
            await addScheduleEvent({
              date: scheduleId,
              time: row.timeStart ?? nowHHMM(),
              endTime: row.timeEnd ?? undefined,
              text: row.text.trim() || undefined,
              atoms,
              id: newIds[i],
            });
          }
        }),
      'Не удалось добавить события',
    );

    setIsSubmitting(false);
    if (!result.ok) return false;
    haptic();
    resetAll();
    return true;
  }, [isSubmitting, totalToAdd, userId, committable, scheduleId, haptic, resetAll]);

  return {
    state,
    inputText,
    errorMessage,
    setInputText,
    submit,
    retry,
    cancel,

    events,
    totalToAdd,
    isSubmitting,
    toggleEvent,
    updateEvent,
    updateAspect,
    removeAspect,
    commit,
  };
}
