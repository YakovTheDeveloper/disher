import type { ComponentProps } from 'react';
import { LongPressRow } from '@/features/shared/long-press-item';
import { CardLayout, type CardLayoutProps } from '@/shared/ui/atoms/CardLayout';

/**
 * CardShell = CardLayout (2×2 геометрия слотов) на подложке LongPressRow
 * (фон/long-press/recent-dot/tod). Единый каркас всех карточек-сообщений:
 * еда / событие / предложка / dish-ингредиент / user-порция.
 *
 * Разделение ответственности:
 *  - CardShell прокидывает обвязку (id/index/tod/recent/onLongPress/className…)
 *    в LongPressRow и раскладывает контент через CardLayout.
 *  - Тап-зоны (label htmlFor, iOS-focus) карточка отдаёт ГОТОВЫМИ <TapTarget>
 *    в слоты title/titleEnd/meta/metaEnd — CardShell их не создаёт.
 *
 * См. tds/ANALYSIS/cardshell-unification-2026-06-25.md
 */
export type CardShellProps = Omit<CardLayoutProps, 'className'> &
  Omit<ComponentProps<typeof LongPressRow>, 'children'> & {
    /** Класс на внутренний CardLayout (редко нужен — стили обычно на LongPressRow). */
    layoutClassName?: string;
  };

export function CardShell({
  title,
  titleEnd,
  meta,
  metaEnd,
  layoutClassName,
  ...rowProps
}: CardShellProps) {
  return (
    <LongPressRow {...rowProps}>
      <CardLayout
        title={title}
        titleEnd={titleEnd}
        meta={meta}
        metaEnd={metaEnd}
        className={layoutClassName}
      />
    </LongPressRow>
  );
}

export default CardShell;
