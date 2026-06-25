import clsx from 'clsx';
import { InlineTimeEditor } from '@/shared/ui/TimeChoose';
import styles from './CardTime.module.scss';

export type CardTimeProps = {
  value: string;
  onCommit: (next: string) => void;
  /** Форматирование строки покоя (правка всё равно на сырой "HH:MM"). */
  formatDisplay?: (value: string) => string;
  /** Dedup: время совпадает с рядом выше → сильно гасим (тап всё равно правит). */
  dim?: boolean;
};

/**
 * CardTime — InlineTimeEditor с in-card хромом (время на подложке, не в желобе).
 * Цвет/типографику ставим на wrapper; InlineTimeEditor внутри их наследует
 * (его `.display/.edit/input` = `color/font: inherit`). НЕ ре-нейтрализуем
 * `--tc-*` — это уже делает `InlineTimeEditor.edit` (иначе дубль/конфликт focus).
 *
 * Используется food-семейством (HP / предложка). Событие = label с диапазоном,
 * другой механизм правки → свой `.time`, не этот примитив.
 *
 * См. tds/ANALYSIS/cardshell-unification-2026-06-25.md
 */
export function CardTime({ value, onCommit, formatDisplay, dim }: CardTimeProps) {
  return (
    <InlineTimeEditor
      value={value}
      onCommit={onCommit}
      formatDisplay={formatDisplay}
      displayClassName={clsx(styles.display, dim && styles.dim)}
      editClassName={styles.edit}
    />
  );
}

export default CardTime;
