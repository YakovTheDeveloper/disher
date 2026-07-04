import React, { ButtonHTMLAttributes } from 'react';
import s from './Button.module.css';
import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography/Text';

// Ось ТОНА × ось ГРОМКОСТИ. Тона: system (уголь, строгий монохром) · accent
// (индиго, холодный). Громкость: filled (сплошная) и `-secondary` (тихий
// soft-tonal ярус). surface — нейтральная приподнятая плитка (плоскость задаёт
// `onSurface`), вне тоновой оси. link/ghost — текстовые утилиты (ссылка / тихая
// «отмена»), вне тоновой оси. Цвета — sys-токены `--sys-color-surface-action-*`.
export type ButtonVariant =
  | 'system'
  | 'accent'
  | 'system-secondary'
  | 'accent-secondary'
  | 'surface'
  | 'link'
  | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /**
   * Плоский режим для secondary-кнопок, лежащих НА поверхности как часть
   * смыслового блока (нижний бар дока). Снимает тень — стандалон-кнопка остаётся
   * с тенью. Через проп, а не [data-surface] (per-surface темизация запрещена).
   */
  flat?: boolean;
  /**
   * Surface-lift: плоскость, НА которой лежит кнопка. Идёт в связке с
   * `variant="surface"` (а также сам по себе включает surface-режим — обратная
   * совместимость). Кнопка поднимается на ярус выше и отделяется от плоскости:
   * · `0` (на surface-0, фон страницы) → fill surface-1 + РАМКА (hairline).
   * · `1` (на surface-1) → fill surface-2 + РАМКА. Цветом на белом не отделить
   *   (surface-2 #fff ≈ surface-1 #fefcf9) — отделяем кромкой.
   * · `2` (на surface-2) → fill surface-2 + ТЕНЬ (elevation-2). Цветом выше некуда
   *   — отделяемся подъёмом.
   * Делает кнопку НЕЙТРАЛЬНОЙ плиткой — тон (system/accent) игнорируется.
   */
  onSurface?: 0 | 1 | 2;
  /**
   * Полная ширина (width:100%). Ширина ортогональна тону — её объявляет консумер
   * (этим пропом или родительским flex), а не вшита в variant.
   */
  fullWidth?: boolean;
  isLoading?: boolean;
  before?: React.ReactNode;
  /** Ведущая иконка — в span слева от метки (currentColor, fixed-size в варианте). */
  icon?: React.ReactNode;
  /** Ведомая иконка — в span справа от метки (напр. стрелка «Далее» в футере). */
  trailingIcon?: React.ReactNode;
  center?: boolean;
  /**
   * Render-тег. `label` + `htmlFor` — для ModalByLabel focus-делегации
   * (кнопка-триггер модалки, напр. «Добавить событие» в нижнем баре).
   */
  as?: 'button' | 'label';
  htmlFor?: string;
}

type ButtonComponent = React.FC<ButtonProps>;

// variant → CSS-класс. Имена тонов с дефисом (`system-secondary`) не маппятся
// 1:1 на CSS-module ключи, поэтому маппинг явный (camelCase в модуле).
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  system: s.system,
  accent: s.accent,
  'system-secondary': s.systemSecondary,
  'accent-secondary': s.accentSecondary,
  surface: s.surface,
  link: s.link,
  ghost: s.ghost,
};

const Button: ButtonComponent = ({
  before,
  icon,
  trailingIcon,
  children,
  variant = 'system',
  onSurface,
  flat = false,
  fullWidth = false,
  isLoading = false,
  className,
  center,
  type = 'button',
  as = 'button',
  htmlFor,
  // disabled/onClick деструктурируем отдельно: иначе `disabled={…}` ДО `{...props}`
  // спред перезатирал бы атрибут, а label-ветка теряла бы onClick.
  disabled,
  onClick,
  ...props
}) => {
  // disabled-вид вешаем и на isLoading (загрузка = временно недоступна), и на
  // disabled. Класс `.disabled` несёт pointer-events:none — это и есть
  // блокировка в as="label" режиме (у <label> нет disabled-атрибута).
  const isDisabled = Boolean(isLoading || disabled);

  // surface-режим: нейтральная приподнятая плитка. Включается variant="surface"
  // ИЛИ самим onSurface (обратная совместимость). Тон игнорируется. Плоскость
  // (onSurface) выбирает отделение: 0|1 → рамка (0 ещё и fill surface-1), 2 → тень.
  // Дефолт — 1.
  const isSurface = variant === 'surface' || onSurface != null;
  const plane = onSurface ?? 1;

  const buttonClasses = clsx(
    s.button,
    isSurface
      ? clsx(
          s.surface,
          plane === 2 ? s.surfaceShadow : s.surfaceBordered,
          plane === 0 && s.surfacePlane0
        )
      : VARIANT_CLASS[variant],
    flat && s.flat,
    fullWidth && s.fullWidth,
    isDisabled && s.disabled,
    className,
    center && s.center
  );

  // Подпись кнопки несёт типо-РОЛЬ через <Text> (миграция «везде на Text»,
  // 2026-06-24): tone-варианты (filled + secondary) → label (16/600), link → body
  // (16/500), ghost — bespoke (italic, роли нет) → без <Text>, размер из CSS.
  const labelRole: 'label' | 'body' | null = isSurface
    ? 'label'
    : variant === 'ghost'
      ? null
      : variant === 'link'
        ? 'body'
        : 'label';
  const labelNode = isLoading ? 'Loading...' : children;

  const content = (
    <>
      {before}
      {icon != null && (
        <span className={s.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {labelRole ? (
        <Text as="span" role={labelRole}>
          {labelNode}
        </Text>
      ) : (
        labelNode
      )}
      {trailingIcon != null && (
        <span className={s.icon} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </>
  );

  // ModalByLabel-режим: <label htmlFor> делегирует фокус в скрытый input →
  // открывает шаг модалки. disabled/type не применимы к label.
  if (as === 'label') {
    // {...props} спредим, чтобы aria-*/data-* не терялись. disabled на label
    // невалиден; блокировку держат снятый htmlFor + guard onClick + .disabled
    // (pointer-events:none). aria-disabled на <label> не ставим — он не контрол,
    // SR его игнорит, реальная блокировка уже трёхслойная.
    return (
      <label
        {...(props as React.HTMLAttributes<HTMLLabelElement>)}
        className={buttonClasses}
        htmlFor={isDisabled ? undefined : htmlFor}
        onClick={
          isDisabled
            ? undefined
            : (onClick as unknown as React.MouseEventHandler<HTMLLabelElement>)
        }
      >
        {content}
      </label>
    );
  }

  // {...props} ПЕРВЫМ — наши контролируемые атрибуты (disabled/type/onClick)
  // объявлены после и не могут быть перезатёрты спредом.
  return (
    <button
      {...props}
      className={buttonClasses}
      disabled={isDisabled}
      type={type}
      onClick={onClick}
    >
      {content}
    </button>
  );
};

export default Button;
