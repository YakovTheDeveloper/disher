import { useCallback, useEffect, useState } from 'react';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';

// Единый набор input-id для 2-шаговой модалки создания порции. Страницы
// продукта и блюда живут на разных роутах (никогда не смонтированы вместе),
// так что одного набора достаточно.
export const PORTION_INPUT_IDS = {
  NAME_INPUT: 'portion-name',
  GRAMS_INPUT: 'portion-grams',
} as const;

export type PortionDraft = { label: string; grams: number };
export type PortionStep = 'idle' | 'name' | 'grams';
type ActiveStep = Exclude<PortionStep, 'idle'>;

export const PORTION_STEPS: ActiveStep[] = ['name', 'grams'];
export const PORTION_STEP_LABELS: Record<ActiveStep, string> = {
  name: 'Название',
  grams: 'Количество',
};

// Статичная карта id→step (id'шники константны) — держим вне компонента,
// чтобы handleFocusCapture был стабильным.
const INPUT_TO_STEP: Record<string, ActiveStep> = {
  [PORTION_INPUT_IDS.NAME_INPUT]: 'name',
  [PORTION_INPUT_IDS.GRAMS_INPUT]: 'grams',
};

const createEmptyDraft = (): PortionDraft => ({ label: '', grams: 0 });

export type UsePortionFlowOpts = {
  /** Существующие названия порций — для блокировки дубля в шаге 1. */
  existingLabels: string[];
  unit: string;
  onCreate: (portion: PortionDraft) => Promise<void> | void;
};

export type PortionFlow = ReturnType<typeof usePortionFlow>;

/**
 * Мини-конечный-автомат 2-шаговой модалки создания порции (название → количество).
 * Зеркало `useDishProductFlow`, но без поиска/деталей. Переходы между шагами
 * делает focus-делегация (`<label htmlFor>` + `onFocusCapture`), а не синхронный
 * `setStep` в обработчике клика — см. CLAUDE.md «Label focus delegation».
 */
export function usePortionFlow({ existingLabels, onCreate }: UsePortionFlowOpts) {
  const [step, setStep] = useState<PortionStep>('idle');
  const [draft, setDraft] = useState<PortionDraft>(() => createEmptyDraft());
  // Посещённые шаги текущей сессии — для `results`-вида Breadcrumbs.
  const [visitedSteps, setVisitedSteps] = useState<ActiveStep[]>([]);

  useSwipeableLock(step !== 'idle');

  useEffect(() => {
    if (step === 'idle') {
      setVisitedSteps((prev) => (prev.length ? [] : prev));
      return;
    }
    setVisitedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, [step]);

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const nextStep = INPUT_TO_STEP[target.id];
    if (!nextStep) return;
    setStep(nextStep);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
      });
    });
  }, []);

  const handleClose = useCallback(() => {
    setDraft(createEmptyDraft());
    setStep('idle');
  }, []);

  useOverlayHistory(step !== 'idle', handleClose);

  // Уникальность label среди существующих порций (trim + case-insensitive).
  // Product keyed by label → дубль перезаписал бы чужую порцию; Dish label-keyed
  // контракт FoodPortionsManager тоже не терпит дублей. Блокируем на входе.
  const isDuplicate = useCallback(
    (label: string) => {
      const norm = label.trim().toLowerCase();
      if (!norm) return false;
      return existingLabels.some((l) => l.trim().toLowerCase() === norm);
    },
    [existingLabels],
  );

  // Шаг 1 → пишем label в draft. НЕ зовём setStep — переход на 'grams' делает
  // focus-делегация (Confirm = <label htmlFor={GRAMS_INPUT}>). Синхронный setStep
  // размонтировал бы <label> до делегирования фокуса. См. CLAUDE.md.
  const handleConfirmName = useCallback((label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setDraft((d) => ({ ...d, label: trimmed }));
  }, []);

  const updateGrams = useCallback(
    (grams: number) => setDraft((d) => ({ ...d, grams })),
    [],
  );

  const handleCommit = useCallback(async () => {
    const label = draft.label.trim();
    if (!label) return;
    await onCreate({ label, grams: draft.grams });
    setDraft(createEmptyDraft());
    setStep('idle');
  }, [draft, onCreate]);

  return {
    step,
    setStep,
    draft,
    updateGrams,
    isDuplicate,
    visitedSteps,
    handleFocusCapture,
    handleClose,
    handleConfirmName,
    handleCommit,
    inputIds: PORTION_INPUT_IDS,
  };
}
