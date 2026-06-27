import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './NutrientGroupTitle.module.scss';

type Props = {
  children: ReactNode;
  /** DOM-тег заголовка — сохраняет heading-семантику (по умолч. `h3`). */
  as?: 'h3' | 'h4' | 'span';
  /** Раскладку (margin/padding) задаёт консумер — голос/цвет владеет примитив. */
  className?: string;
};

/**
 * Тихий заголовок группы нутриентов (БЖУ / Минералы / Витамины / Аминокислоты).
 *
 * Идиома «iOS grouped-list section header» + канон нутриентных подписей disher
 * (uppercase-sans, НЕ serif): caption-ярус через `<Text role="caption">` владеет
 * типографикой, а этот примитив добавляет лишь «тихую структурную метку» —
 * uppercase + приглушённый холодный цвет (`--sys-color-text-quiet`). Не кричит,
 * делит список на группы, не перетягивая внимание с имён нутриентов и чисел.
 *
 * ЕДИНЫЙ дом для ВСЕХ мест, где рендерятся группы нутриентов
 * (NutrientTable view + «Моя норма», NutrientPickerDrawer) — чтобы стиль
 * заголовка не разъезжался по модулям.
 */
export const NutrientGroupTitle = ({ children, as = 'h3', className }: Props) => (
  <Text as={as} role="caption" className={clsx(styles.title, className)}>
    {children}
  </Text>
);

export default NutrientGroupTitle;
