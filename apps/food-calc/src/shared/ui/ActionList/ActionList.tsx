import type { ElementType, ReactNode } from 'react';
import clsx from 'clsx';
import { Heading } from '@/shared/ui/atoms/Typography';
import styles from './ActionList.module.scss';

type ActionListProps = {
  children: ReactNode;
  className?: string;
};

/**
 * ActionList — доменный композит раскладки «списка действий», брат `FormLayout`,
 * но НЕ форма. Чистый layout-слой: владеет ДВУМЯ ярусами отступов и больше ничем —
 *   • между группами (секциями) → `--sys-stack-section` (24), owl-паттерн;
 *   • внутри группы: заголовок → контент → `--sys-stack-row` (8), см. `Section`.
 *
 * Контент секции — ЛЮБОЙ (ряды `SettingRow`, пикер, чип-статус…): примитив не знает
 * про бровки/рамки (их несёт сам ряд) и ничего не рендерит, кроме заголовка и
 * контейнеров-распорок. Принцип как у `FormLayout`: пространством владеет контейнер,
 * ни один ребёнок не ставит себе `margin` — это разводит класс регрессий «поехало
 * после правки соседа».
 *
 * Извлечён из повторяющегося блока корня «Аккаунт» (`ProfileDrawer`), где `section`
 * + `Text role="label"` + группа рядов дублировались в каждом разделе.
 */
export function ActionList({ children, className }: ActionListProps) {
  return <div className={clsx(styles.layout, className)}>{children}</div>;
}

type SectionProps = {
  children: ReactNode;
  /** Заголовок секции (рендерится через `<Text role="label">`). Опционален. */
  label?: ReactNode;
  /**
   * DOM-тег заголовка для корректного document outline — `h2` на корне дровера,
   * `h3` на под-экране (заголовок дровера = h1/h2, тело держит следующий ярус).
   * Дефолт `h2`.
   */
  as?: ElementType;
  className?: string;
};

/**
 * ActionList.Section — семантическая группа как первоклассная сущность (аналог
 * `FormLayout.Group`). Владеет ОДНИМ зазором ВНУТРИ себя: заголовок → контент
 * тесно (`--sys-stack-row`, 8 — подпись принадлежит группе). Контент передаётся
 * детьми как есть; если это несколько блоков (напр. ряды + строка статуса), между
 * ними ложится тот же row-зазор.
 */
function Section({ children, label, as = 'h2', className }: SectionProps) {
  return (
    <section className={clsx(styles.section, className)}>
      {label != null && (
        <Heading as={as} role="title" className={styles.sectionLabel}>
          {label}
        </Heading>
      )}
      {children}
    </section>
  );
}

ActionList.Section = Section;

export default ActionList;
