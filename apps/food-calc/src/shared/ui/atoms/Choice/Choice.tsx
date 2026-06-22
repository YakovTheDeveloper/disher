import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import TickIcon from '@/shared/assets/icons/tick.svg?react';
import styles from './Choice.module.scss';

type Orientation = 'horizontal' | 'vertical';

type ChoiceContextValue = {
  value: string | null | undefined;
  select: (value: string) => void;
};

const ChoiceContext = createContext<ChoiceContextValue | null>(null);

function useChoiceContext(): ChoiceContextValue {
  const ctx = useContext(ChoiceContext);
  if (!ctx) throw new Error('ChoiceItem must be rendered inside a ChoiceGroup');
  return ctx;
}

export type ChoiceGroupProps = {
  /** Текущее выбранное значение (null/undefined — выбора нет). */
  value: string | null | undefined;
  /** Коммит выбора. Вызывается и на клик, и на стрелочную навигацию. */
  onChange: (value: string) => void;
  /** Раскладка группы — задаёт, какие стрелки навигируют (←/→ vs ↑/↓). */
  orientation?: Orientation;
  'aria-label'?: string;
  className?: string;
  children: ReactNode;
};

/**
 * ChoiceGroup — обёртка одиночного выбора (роль `radiogroup`).
 *
 * Семантика «1 из многих»: `role=radiogroup` + roving-tabindex + стрелки
 * (←/→ или ↑/↓ по `orientation`, плюс Home/End). Стрелка перемещает фокус И
 * выбирает (канон WAI-ARIA radiogroup) — это смена семантики против старого
 * `aria-pressed`-тумблера, а не косметика. Маркер «выбрано» у `ChoiceItem` —
 * кромка + галочка в углу, БЕЗ заливки; цвет из `--sys-color-*-selected`,
 * форма угловатая (`--sys-radius-control`).
 *
 * Дети приходят `.map()`-ом от консумера (значения/лейблы — его данные), поэтому
 * roving управляется через DOM-запрос `[role="radio"]`, а не через реестр рефов.
 */
export function ChoiceGroup({
  value,
  onChange,
  orientation = 'horizontal',
  className,
  children,
  ...rest
}: ChoiceGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const select = useCallback((next: string) => onChange(next), [onChange]);

  // Roving tabindex: ровно один radio в группе фокусируем по Tab — выбранный,
  // либо первый, если выбора нет. Управляем атрибутом напрямую (JSX-проп не
  // ставим), чтобы случай «ничего не выбрано» оставлял группу доступной с клавы.
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const radios = Array.from(
      root.querySelectorAll<HTMLElement>('[role="radio"]:not([aria-disabled="true"])'),
    );
    if (!radios.length) return;
    let activeIdx = radios.findIndex((r) => r.getAttribute('aria-checked') === 'true');
    if (activeIdx < 0) activeIdx = 0;
    radios.forEach((r, i) => {
      r.tabIndex = i === activeIdx ? 0 : -1;
    });
  });

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    const backward = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
    const home = e.key === 'Home';
    const end = e.key === 'End';
    if (!forward && !backward && !home && !end) return;
    const root = ref.current;
    if (!root) return;
    const radios = Array.from(
      root.querySelectorAll<HTMLElement>('[role="radio"]:not([aria-disabled="true"])'),
    );
    if (!radios.length) return;
    e.preventDefault();
    const curr = radios.findIndex((r) => r === document.activeElement);
    let next: number;
    if (home) next = 0;
    else if (end) next = radios.length - 1;
    else if (forward) next = curr < 0 ? 0 : (curr + 1) % radios.length;
    else next = curr < 0 ? radios.length - 1 : (curr - 1 + radios.length) % radios.length;
    const target = radios[next];
    target.focus();
    target.click();
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-orientation={orientation}
      className={className}
      onKeyDown={onKeyDown}
      {...rest}
    >
      <ChoiceContext.Provider value={{ value, select }}>{children}</ChoiceContext.Provider>
    </div>
  );
}

export type ChoiceItemProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'role' | 'aria-checked'
> & {
  /** Значение этого варианта (сверяется с `ChoiceGroup.value`). */
  value: string;
  /** Колонка «заголовок + подпись» (sex/активность/цель) вместо строки. */
  stacked?: boolean;
};

/**
 * ChoiceItem — один вариант одиночного выбора (`role=radio`). Только внутри
 * `ChoiceGroup`. Презентация: угловатая кромка + галочка-маркер; поведение
 * (немедленный коммит / toggle-off) задаёт `onChange` группы у консумера.
 */
export function ChoiceItem({
  value,
  stacked = false,
  className,
  children,
  onClick,
  disabled,
  ...rest
}: ChoiceItemProps) {
  const ctx = useChoiceContext();
  const checked = ctx.value === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      // Mirror `disabled` to aria-disabled so the group's roving-tabindex query
      // (`:not([aria-disabled="true"])`) skips it — otherwise it could land
      // tabIndex=0 on a non-focusable item and trap the group out of Tab order.
      aria-disabled={disabled || undefined}
      className={clsx(
        styles.choice,
        stacked && styles.stacked,
        checked && styles.checked,
        className,
      )}
      onClick={(e) => {
        onClick?.(e);
        ctx.select(value);
      }}
      {...rest}
    >
      <span className={styles.content}>{children}</span>
      <TickIcon className={styles.marker} aria-hidden />
    </button>
  );
}
