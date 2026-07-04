import type { ReactNode } from 'react';
import { Text, QuietLabel } from '@/shared/ui/atoms/Typography';
import s from './WriteBarHint.module.scss';

// Inline-режим: первое слово подсказки — тихий serif-italic акцент (<QuietLabel>),
// остаток — обычным телом. Используется когда нет отдельной метки-заголовка.
function renderHint(text: string): ReactNode {
  const spaceIdx = text.indexOf(' ');
  if (spaceIdx === -1) return text;
  return (
    <>
      <QuietLabel as="em" className={s.accent}>
        {text.slice(0, spaceIdx)}
      </QuietLabel>
      {text.slice(spaceIdx)}
    </>
  );
}

export interface WriteBarHintProps {
  /** Пример-подсказка (тело). Переносы — через `\n` (CSS white-space: pre-line). */
  body: string;
  /**
   * Необязательный заголовок отдельной строкой ПО ЦЕНТРУ сверху (напр. «Например»),
   * тело — под ним (stacked). Без label — inline-режим (первое слово тела акцентом).
   */
  label?: string;
  /** Показ на фокусе — управляется `expanded`-стейтом бара. */
  visible: boolean;
}

/**
 * Подсказка-пример над write-баром: раскрывается на фокусе (reveal height 0→auto +
 * fade), сам бар не двигает. Два режима — stacked (label-заголовок + тело ниже) и
 * inline (первое слово тела акцентом). Общая для всех write-баров (Еда/События/
 * Гипотезы), питается через `hint`/`hintLabel` пропы `WriteBarShell`.
 */
export const WriteBarHint = ({ body, label, visible }: WriteBarHintProps) => {
  // Self-guard: без контента (ни тела, ни заголовка) не рендерим пустую reveal-
  // полоску — контракт безопасен для прямого переиспользования на любом write-баре.
  if (!body && !label) return null;
  return (
    <div
      className={s.hint}
      data-visible={visible || undefined}
      data-stacked={label ? '' : undefined}
      aria-hidden="true"
    >
      {label ? (
        <>
          <QuietLabel as="em" className={s.label}>
            {label}
          </QuietLabel>
          {body ? (
            <Text as="span" role="caption" className={s.body}>
              {body}
            </Text>
          ) : null}
        </>
      ) : (
        <Text as="span" role="caption" className={s.inner}>
          {renderHint(body)}
        </Text>
      )}
    </div>
  );
};

export default WriteBarHint;
