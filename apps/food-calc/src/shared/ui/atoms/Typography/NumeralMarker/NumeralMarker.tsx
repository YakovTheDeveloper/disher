import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import Text from '../Text/Text';
import Numeral from '../Numeral/Numeral';
import styles from './NumeralMarker.module.scss';

/** Что за хвостик при числе: единица измерения (г/мг/ккал) или знак (%). */
type MarkerKind = 'unit' | 'sign';

// `role` вырезан из HTMLAttributes: маркер сам решает роль дочернего <Text>
// (caption), а спред сырого aria-`role` перекрыл бы её и сломал типизацию Text.
type Props = {
  children: ReactNode;
  /** Дефолт `unit` — единиц в приложении кратно больше, чем знаков. */
  kind?: MarkerKind;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, 'role'>;

/**
 * NumeralMarker — тихий хвостик ПРИ числе: единица («г», «мг», «ккал») или знак
 * («%»). Дом этого голоса; раньше он жил руками в NutrientMeterRow.module.scss
 * двумя копиями (.footUnit / .pctFlushSign) и был скопирован бы третьей в
 * FoodActionCard.
 *
 * Голос = приглушённость (opacity 0.4) + ярус «тише числа»: единица берёт
 * прозовый caption с НАСТОЯЩИМ курсивом (маркер-пометка «на полях», не метка), знак
 * — числовой голос тонким весом (он часть числа, а не проза, и обязан жить в той же
 * гарнитуре). Единица садится на межстрочный <Numeral>, а не caption'а, — иначе
 * хвостик не встаёт на строку своего числа.
 *
 * ВЁРСТКА НЕ ЗДЕСЬ — намеренно. У дровера маркер СВИСАЕТ в боковой жёлоб
 * (position:absolute; left:100%), потому что у дровера этот жёлоб есть; у карточки
 * поиска справа стоит ⓘ, и она ставит маркеры второй колонкой грида. Общий у них
 * голос, а не раскладка, — поэтому примитив не несёт ни position, ни display.
 */
const NumeralMarker = ({ children, kind = 'unit', className, ...rest }: Props) => {
  if (kind === 'sign') {
    return (
      <Numeral
        as="span"
        size="sm"
        weight="thin"
        className={clsx(styles.marker, className)}
        {...rest}
      >
        {children}
      </Numeral>
    );
  }
  return (
    <Text
      as="span"
      role="caption"
      className={clsx(styles.marker, styles.marker_unit, className)}
      {...rest}
    >
      {children}
    </Text>
  );
};

export default NumeralMarker;
