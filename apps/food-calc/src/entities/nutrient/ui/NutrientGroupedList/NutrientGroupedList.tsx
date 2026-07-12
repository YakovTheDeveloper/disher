import clsx from 'clsx';
import { Fragment, type ReactNode } from 'react';
import type { Nutrient, NutrientGroup } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientGroupTitle } from '@/entities/nutrient/ui/NutrientGroupTitle';
import s from './NutrientGroupedList.module.scss';

type Props = {
  /** Группы нутриентов в порядке показа (обычно `nutrientDisplayGroups`). */
  groups: NutrientGroup[];
  /** Слот-ряд: консьюмер сам выбирает ряд (мера / норма / редактор). */
  renderRow: (nutrient: Nutrient) => ReactNode;
  /**
   * Плотность/раскладка секций — ТОЛЬКО стиль, не поведение:
   *   'meter' (по умолч.) — витрина/редактор (воздух между группами, section);
   *   'norms' — «Моя норма» (плотный inset-grouped список).
   */
  variant?: 'meter' | 'norms';
};

/**
 * ЕДИНСТВЕННЫЙ владелец обхода групп нутриентов → секции + тихие заголовки.
 * Ряд отдаётся через слот (`renderRow`) — контейнер НЕ знает про нормы/значения/
 * daily-norm, только «группа → заголовок → список рядов». Именно слот убил бывший
 * 4-way `variant`-энум `NutrientTable` (см. tds/nutrient-components-reorg-2026-07-11).
 *
 * Курированный порядок первой группы (БЖУ) зашит в данные (`nutrientDisplayGroups`),
 * поэтому обход тут — чистый, без спец-логики первой группы.
 */
export function NutrientGroupedList({ groups, renderRow, variant = 'meter' }: Props) {
  const norms = variant === 'norms';
  return (
    <div className={clsx(s.container, norms && s.containerNorms)}>
      {groups.map((group) => (
        <section key={group.name} className={norms ? s.normGroup : s.section}>
          <NutrientGroupTitle className={norms ? s.normGroupTitle : s.sectionTitle}>
            {group.displayName}
          </NutrientGroupTitle>
          <div className={norms ? s.normList : s.rowList}>
            {/* key принадлежит контейнеру (по стабильному id нутриента) — слот
                `renderRow` не обязан его ставить. Fragment не создаёт DOM, ряды
                остаются прямыми соседями → бровка `:last-child` держится. */}
            {group.content.map((nutrient) => (
              <Fragment key={nutrient.id}>{renderRow(nutrient)}</Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default NutrientGroupedList;
