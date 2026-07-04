import { ButtonHTMLAttributes, LabelHTMLAttributes, ReactNode, forwardRef } from 'react';
import clsx from 'clsx';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import s from './IconButton.module.scss';

// Тон icon-кнопки = press-трактовка. `neutral` — тихий глиф, на press заливается
// чернилами (system) с on-accent глифом. `danger` — danger-глиф, на press —
// danger-подложка (урна). `ghost` — холодный глиф БЕЗ подложки (ни в покое, ни на
// press: только scale + приглушение), для page-level слотов (topContentRight
// листа). Без тона — «голый» shell: вид целиком несёт className (напр. clear-×
// с собственной заливкой-пузырём), примитив даёт только каркас + usePressFeedback
// + a11y.
export type IconButtonTone = 'neutral' | 'danger' | 'ghost';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Глиф (svg). currentColor; собственный размер несёт сам svg или `size`. */
  icon: ReactNode;
  /** Обязателен — у иконки-кнопки нет текстовой метки (a11y). */
  'aria-label': string;
  tone?: IconButtonTone;
  /** Сторона квадратного тап-таргета (px). Без фикс-пресетов — прокидывается. */
  size?: number;
  /**
   * Если задан — кнопка рендерится как `<label htmlFor>` вместо `<button>`, чтобы
   * клик делегировал фокус на целевой input (iOS-safe тригер модалок/дроверов
   * через focus, где программный `.focus()` ненадёжен — см. ModalByLabel-канон).
   */
  htmlFor?: string;
}

// Icon-only кнопка: владеет usePressFeedback (JS data-pressed — надёжная press-
// инверсия там, где :active на iOS ненадёжен) + требует aria-label + tone.
// Экспортит только компонент (Fast Refresh — fastrefresh-screenindicator).
// forwardRef: нужен Base UI render-пропу (Drawer.Close render={<IconButton/>}) —
// он прокидывает ref на каркас для focus-менеджмента. В label-режиме (`htmlFor`)
// ref не форвардится (Base UI этот путь не использует).
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, tone, size, className, style, type = 'button', htmlFor, disabled, ...props },
  ref
) {
  const { pressed, pressProps } = usePressFeedback();
  const cls = clsx(
    s.iconButton,
    tone === 'neutral' && s.neutral,
    tone === 'danger' && s.danger,
    tone === 'ghost' && s.ghost,
    className
  );
  const mergedStyle = size != null ? { ...style, width: size, height: size } : style;

  if (htmlFor != null) {
    return (
      <label
        htmlFor={htmlFor}
        className={cls}
        style={mergedStyle}
        // props типизированы под <button>; в label-режиме передаём только
        // DOM-совместимое подмножество (aria-*, onClick и т.п.) — cast безопасен.
        // button-специфичные `type`/`disabled` деструктурированы выше и в `...props`
        // не попадают (на <label> `disabled` — невалидный no-op, тихо проглотился бы).
        {...(props as unknown as LabelHTMLAttributes<HTMLLabelElement>)}
        {...pressProps}
        data-pressed={pressed || undefined}
      >
        {icon}
      </label>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cls}
      style={mergedStyle}
      {...props}
      {...pressProps}
      data-pressed={pressed || undefined}
    >
      {icon}
    </button>
  );
});

export default IconButton;
