import type { ReactNode } from 'react';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import s from './FoodDrawerType.module.scss';

interface Props {
  /** Тип сущности («Мой продукт» / «Продукт» / «Блюдо»). Пусто → ничего. */
  type?: string;
  /**
   * Правый слот в один ряд с типом (напр. Select способа измерения количества у
   * продукта, запрос 2026-07-19): тип слева — контрол справа. Пусто → тип центрируется.
   */
  trailing?: ReactNode;
}

/**
 * Тип еды под хедером дровера — общий с дровером блюда голос (эталон —
 * ProductDrawer, запрос 2026-07-19). Крупный title-ярус, тихий secondary-цвет:
 * это контекст сущности, а не звезда. Само имя уехало обратно в заголовок хедера
 * (`DrawerLayout title`), поэтому здесь — только тип, без секции-обёртки.
 */
export function FoodDrawerType({ type, trailing }: Props) {
  if (!type) return null;
  if (trailing != null) {
    return (
      <div className={s.row}>
        <Text as="p" role="caption" className={s.type}>
          {type}
        </Text>
        {trailing}
      </div>
    );
  }
  return (
    <Heading as="p" role="title" className={s.type}>
      {type}
    </Heading>
  );
}

export default FoodDrawerType;
