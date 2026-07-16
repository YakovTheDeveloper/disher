import clsx from 'clsx';
import { InlineTimeEditor } from '@/shared/ui/TimeChoose';
import { TapTarget } from '@/shared/ui/atoms/TapTarget';
import styles from './CardTime.module.scss';

export type CardTimeProps = {
  value: string;
  onCommit?: (next: string) => void;
  /** Форматирование строки покоя (правка всё равно на сырой "HH:MM"). */
  formatDisplay?: (value: string) => string;
  /** Dedup: время совпадает с рядом выше → сильно гасим (тап всё равно правит). */
  dim?: boolean;
  /**
   * Задан → время НЕ правится инлайн, а становится `<label htmlFor>`: тап
   * делегирует фокус инпуту модалки (ModalByLabel-канон, iOS-safe). Так правит
   * предложка — правка ряда идёт единым флоу еды, а не полем в строке.
   */
  htmlFor?: string;
  /** Stash id/uid правимой строки в dataset инпута ДО фокуса (label-режим). */
  onPointerDown?: () => void;
};

/**
 * CardTime — InlineTimeEditor с in-card хромом (время на подложке, не в желобе).
 * Цвет/типографику ставим на wrapper; InlineTimeEditor внутри их наследует
 * (его `.display/.edit/input` = `color/font: inherit`). НЕ ре-нейтрализуем
 * `--tc-*` — это уже делает `InlineTimeEditor.edit` (иначе дубль/конфликт focus).
 *
 * Используется food-семейством (HP / предложка). Событие = label с диапазоном,
 * другой механизм правки → свой `.time`, не этот примитив.
 */
export function CardTime({
  value,
  onCommit,
  formatDisplay,
  dim,
  htmlFor,
  onPointerDown,
}: CardTimeProps) {
  if (htmlFor != null) {
    return (
      <TapTarget
        as="label"
        htmlFor={htmlFor}
        onPointerDown={onPointerDown}
        className={clsx(styles.display, dim && styles.dim)}
      >
        {formatDisplay ? formatDisplay(value) : value}
      </TapTarget>
    );
  }

  return (
    <InlineTimeEditor
      value={value}
      onCommit={onCommit ?? (() => {})}
      formatDisplay={formatDisplay}
      displayClassName={clsx(styles.display, dim && styles.dim)}
      editClassName={styles.edit}
    />
  );
}

export default CardTime;
