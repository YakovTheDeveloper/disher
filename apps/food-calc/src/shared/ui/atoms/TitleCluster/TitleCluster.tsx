import type { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './TitleCluster.module.scss';

interface TitleClusterProps {
  children: ReactNode;
  /** Доп.класс на кластер (контекстный override консумера). */
  className?: string;
}

/**
 * TitleCluster — title-слот карточки еды: горизонтальная стопка `[qty][имя]`
 * (qty ПЕРЕД именем, gap 8px, базовая линия общая). Кладётся node-escape'ом в
 * `Card.Title`; внутри консумер сам решает, чем заполнить (EditableQuantity +
 * имя/детали).
 *
 * Свёрнут из трёх идентичных локальных клонов кластера (ScheduleFoodItemInline /
 * DishBuilderPage / ProposalFoodItem) — card-chassis-simplify 2026-06-26.
 */
export function TitleCluster({ children, className }: TitleClusterProps) {
  return <div className={clsx(styles.cluster, className)}>{children}</div>;
}

export default TitleCluster;
