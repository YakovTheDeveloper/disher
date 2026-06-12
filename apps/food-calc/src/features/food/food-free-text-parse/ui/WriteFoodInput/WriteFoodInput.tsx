import { useCallback } from 'react';
import { WriteBarShell, WriteBarMedal } from '@/shared/ui/WriteBarShell';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import type { UseWriteFoodFlowResult } from '../../model/useWriteFoodFlow';
import s from './WriteFoodInput.module.scss';

// Дуговые подписи медальона-печати «Выбор еды» (верх/низ, как на монете).
const ARC_TOP = 'выбрать из';
const ARC_BOTTOM = 'списка еды';

// Фоновая гравюра плитки «Выбор еды» — клош (cloche / room-service dome).
const FOOD_TILE_IMG = '/art/plate.png';

const DEFAULT_PLACEHOLDER = 'Опишите, что ели…';
const ANCHOR_SELECTOR = '[data-write-food-anchor]';

export interface WriteFoodInputProps {
  /** free-text-food flow (см. `useWriteFoodFlow`). */
  flow: UseWriteFoodFlowResult;
  /** id для `<input>`/`<textarea>` — должен совпадать с `htmlFor` у внешних триггеров. */
  inputId: string;
  placeholder?: string;
  /** htmlFor для search-affordance (медальон «Выбор еды»). */
  searchHtmlFor: string;
  searchLabel?: string;
  /** Подпись под лупой (например, "Каталог"). */
  searchText?: string;
  /** Опциональная подсказка-пример над баром в фокусе. */
  hint?: string;
  className?: string;
}

/**
 * Messenger-style write-field для free-text-food: тонкий адаптер над
 * `WriteBarShell` (2026-06-09). Передаёт медальон «Выбор еды» как rightSlot,
 * в ready-state подменяет поле на CTA «Посмотреть варианты». Caller обязан НЕ
 * монтировать `<WriteFoodModals>` overlay — иначе дубликат `id={inputId}`.
 */
export const WriteFoodInput = ({
  flow,
  inputId,
  placeholder = DEFAULT_PLACEHOLDER,
  searchHtmlFor,
  searchLabel,
  searchText,
  hint,
  className,
}: WriteFoodInputProps) => {
  const online = useOnline();

  const isReady = flow.state === 'ready';
  const isLoading = flow.state === 'loading';

  const handleSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      flow.submit(trimmed);
    },
    [flow],
  );

  // Ready-state: instant-scroll до предложки + короткий shake.
  const handleViewResults = useCallback(() => {
    const target = document.querySelector(ANCHOR_SELECTOR) as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
    target.removeAttribute('data-shake');
    void target.offsetWidth;
    target.setAttribute('data-shake', '');
  }, []);

  return (
    <WriteBarShell
      className={className}
      value={flow.inputText}
      onChange={flow.setInputText}
      onSubmit={handleSubmit}
      inputId={inputId}
      placeholder={placeholder}
      online={online}
      // Бар еды: заливка+рамка пилюли растворяются к правому торцу (у медали
      // «Выбор еды»). Только здесь — Анализ/События остаются с ровной рамкой.
      fadeRight
      busy={isLoading}
      readOnly={isLoading}
      hint={hint}
      writeState={isReady ? 'ready' : 'idle'}
      scrollToOnSubmit={ANCHOR_SELECTOR}
      fieldOverride={
        isReady ? (
          <button type="button" className={s.readyCta} onClick={handleViewResults}>
            Посмотреть варианты
          </button>
        ) : undefined
      }
      rightSlot={
        <WriteBarMedal
          htmlFor={searchHtmlFor}
          ariaLabel={searchLabel ?? searchText ?? 'Найти'}
          img={FOOD_TILE_IMG}
          arcTop={ARC_TOP}
          arcBottom={ARC_BOTTOM}
          dimmed={isReady}
        />
      }
    />
  );
};

export default WriteFoodInput;
