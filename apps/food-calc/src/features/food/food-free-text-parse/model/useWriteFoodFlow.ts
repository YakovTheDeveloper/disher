import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  parseFreeTextFood,
  type ParseResponse,
} from '../api/parseFreeTextFood';
import {
  clearParseState,
  readParseState,
  writeParseState,
  type PersistedParseState,
} from './parseStateStorage';
import { getReviewUrl, targetId, type ParseTarget } from './target';

export type WriteFoodFlowState = 'idle' | 'loading' | 'ready' | 'error';

const PARSE_TIMEOUT_MS = 35_000;
const STALE_LOADING_MS = 60_000;

export interface UseWriteFoodFlowResult {
  state: WriteFoodFlowState;
  parseResult: ParseResponse | null;
  inputText: string;
  errorMessage: string | null;
  submit: (text: string) => void;
  retry: () => void;
  cancel: () => void;
  minimize: () => void;
  goToReview: () => void;
  clearAfterCommit: () => void;
  setInputText: (text: string) => void;
}

function makeRequestId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof (crypto as Crypto).randomUUID === 'function'
  ) {
    return (crypto as Crypto).randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useWriteFoodFlow(target: ParseTarget): UseWriteFoodFlowResult {
  const navigate = useNavigate();

  const [state, setState] = useState<WriteFoodFlowState>('idle');
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const targetKeyRef = useRef<string>(`${target.kind}:${targetId(target)}`);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const abortActive = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearTimer();
  }, [clearTimer]);

  const startFetch = useCallback(
    (text: string, requestId: string, startedAt: number) => {
      const controller = new AbortController();
      abortRef.current = controller;
      activeRequestIdRef.current = requestId;

      clearTimer();
      timeoutRef.current = setTimeout(() => {
        if (activeRequestIdRef.current !== requestId) return;
        controller.abort();
        const persisted: PersistedParseState = {
          target,
          status: 'error',
          inputText: text,
          errorMessage: 'Не дождались ответа. Попробуйте ещё раз.',
          startedAt,
          requestId,
        };
        writeParseState(persisted);
        setState('error');
        setErrorMessage(persisted.errorMessage ?? null);
      }, PARSE_TIMEOUT_MS);

      parseFreeTextFood(text, controller.signal).then(
        (response) => {
          if (controller.signal.aborted) return;
          if (activeRequestIdRef.current !== requestId) return;
          clearTimer();
          const persisted: PersistedParseState = {
            target,
            status: 'ready',
            inputText: text,
            parseResult: response,
            startedAt,
            requestId,
          };
          writeParseState(persisted);
          setParseResult(response);
          setErrorMessage(null);
          setState('ready');
        },
        (err: unknown) => {
          if (controller.signal.aborted) return;
          if (activeRequestIdRef.current !== requestId) return;
          clearTimer();
          const message =
            err instanceof Error ? err.message : 'Не удалось разобрать текст';
          const persisted: PersistedParseState = {
            target,
            status: 'error',
            inputText: text,
            errorMessage: message,
            startedAt,
            requestId,
          };
          writeParseState(persisted);
          setErrorMessage(message);
          setState('error');
        },
      );
    },
    [clearTimer, target],
  );

  // Restore state from storage when target changes.
  useEffect(() => {
    const nextKey = `${target.kind}:${targetId(target)}`;

    // Target actually changed vs. a ref identity change — reset local state.
    if (targetKeyRef.current !== nextKey) {
      abortActive();
      activeRequestIdRef.current = null;
      targetKeyRef.current = nextKey;
    }

    const persisted = readParseState(target);
    if (!persisted) {
      setState('idle');
      setParseResult(null);
      setInputText('');
      setErrorMessage(null);
      return;
    }

    setInputText(persisted.inputText);

    if (persisted.status === 'ready' && persisted.parseResult) {
      setParseResult(persisted.parseResult);
      setErrorMessage(null);
      setState('ready');
      return;
    }

    if (persisted.status === 'error') {
      setParseResult(null);
      setErrorMessage(persisted.errorMessage ?? 'Не удалось разобрать текст');
      setState('error');
      return;
    }

    // loading
    const age = Date.now() - persisted.startedAt;
    if (age >= STALE_LOADING_MS) {
      const updated: PersistedParseState = {
        ...persisted,
        status: 'error',
        errorMessage: 'Не дождались ответа. Попробуйте ещё раз.',
      };
      writeParseState(updated);
      setParseResult(null);
      setErrorMessage(updated.errorMessage ?? null);
      setState('error');
      return;
    }

    // Within grace window — re-submit with new requestId, keep same inputText.
    setParseResult(null);
    setErrorMessage(null);
    setState('loading');
    const newRequestId = makeRequestId();
    const refreshed: PersistedParseState = {
      ...persisted,
      requestId: newRequestId,
      startedAt: Date.now(),
    };
    writeParseState(refreshed);
    startFetch(persisted.inputText, newRequestId, refreshed.startedAt);
    // cleanup on unmount handled by separate effect
  }, [target.kind, targetId(target)]);

  // Unmount cleanup — abort in-flight fetch and clear timer, but DON'T clear storage.
  useEffect(() => {
    return () => {
      abortActive();
    };
  }, []);

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      abortActive();
      const requestId = makeRequestId();
      const startedAt = Date.now();
      const persisted: PersistedParseState = {
        target,
        status: 'loading',
        inputText: trimmed,
        startedAt,
        requestId,
      };
      writeParseState(persisted);
      setInputText(trimmed);
      setParseResult(null);
      setErrorMessage(null);
      setState('loading');
      startFetch(trimmed, requestId, startedAt);
    },
    [abortActive, startFetch, target],
  );

  const retry = useCallback(() => {
    if (!inputText.trim()) {
      setState('idle');
      return;
    }
    submit(inputText);
  }, [inputText, submit]);

  const cancel = useCallback(() => {
    abortActive();
    activeRequestIdRef.current = null;
    clearParseState(target);
    setState('idle');
    setParseResult(null);
    setInputText('');
    setErrorMessage(null);
  }, [abortActive, target]);

  const minimize = useCallback(() => {
    // Intentionally no-op on state/storage — modal close is the caller's responsibility.
    // Fetch keeps going.
  }, []);

  const goToReview = useCallback(() => {
    if (state !== 'ready' || !parseResult) return;
    navigate(getReviewUrl(target), { state: { parseResult } });
  }, [navigate, parseResult, state, target]);

  const clearAfterCommit = useCallback(() => {
    clearParseState(target);
    setState('idle');
    setParseResult(null);
    setInputText('');
    setErrorMessage(null);
  }, [target]);

  return {
    state,
    parseResult,
    inputText,
    errorMessage,
    submit,
    retry,
    cancel,
    minimize,
    goToReview,
    clearAfterCommit,
    setInputText,
  };
}
