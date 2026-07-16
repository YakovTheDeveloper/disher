import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './SettingRow.module.scss';

type Props = {
  /** Ведущий значок — наследует `currentColor` (холодный серый .icon). */
  icon?: ReactNode;
  label: string;
  /** Вторая строка под label — тихий caption (пояснение / статус). */
  sub?: string;
  /** Хвост справа: шеврон-навигация или интерактивный контрол (Switch). */
  trailing?: ReactNode;
  /** Danger-тон (ряд «Выйти из аккаунта») — красный label + sub + хвост. */
  danger?: boolean;
  /** Недоступный ряд — приглушён, клик не стреляет (напр. «Разобрать день» офлайн
   *  / за пустой день). Причину недоступности несёт `sub`. */
  disabled?: boolean;
  /** С onClick ряд = <button> (навигация / действие); без него — <div>-контейнер,
   *  интерактивен только сам trailing (напр. Switch). */
  onClick?: () => void;
  /** Задан → ряд = `<label htmlFor>` (делегирует фокус инпуту шага, iOS focus-
   *  канон), а не кнопка. Для хаб-рядов, открывающих шаг флоу (перебивает onClick). */
  htmlFor?: string;
  /** Stash перед фокусом при label-делегации: pointerdown отрабатывает ДО click. */
  onPointerDown?: () => void;
  'aria-label'?: string;
  /** Доп. класс на корень ряда (аддитивный) — напр. tall-override в хабе «Открытия». */
  className?: string;
};

/**
 * Плоский ряд настроек/действий: [значок] + label(+sub) + trailing.
 * Группа таких рядов держится ВЫРАВНИВАНИЕМ и тающей бровкой СНИЗУ у каждого ряда
 * (`.row::after`), БЕЗ фона/рамки/тени — канон paper-mono (Divider + Typography),
 * а не iOS-плашка. Типографику несут <Text>, класс держит только раскладку/цвет.
 * Дом корня ProfileDrawer («Аккаунт») и хаба «Разбор» (AnalysisHubDrawer).
 */
export function SettingRow({
  icon,
  label,
  sub,
  trailing,
  danger,
  disabled,
  onClick,
  htmlFor,
  onPointerDown,
  'aria-label': ariaLabel,
  className,
}: Props) {
  const body = (
    <>
      {icon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.main}>
        <Text as="span" role="body" className={styles.label}>
          {label}
        </Text>
        {sub ? (
          <Text as="span" role="caption" className={styles.sub}>
            {sub}
          </Text>
        ) : null}
      </span>
      {trailing ? <span className={styles.trail}>{trailing}</span> : null}
    </>
  );

  const cls = clsx(styles.row, danger && styles.danger, disabled && styles.disabled, className);

  if (htmlFor) {
    return (
      <label className={cls} htmlFor={htmlFor} onPointerDown={onPointerDown} aria-label={ariaLabel}>
        {body}
      </label>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={cls}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

export default SettingRow;
