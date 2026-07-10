import type { SVGProps } from 'react';

interface InfoIconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /**
   * Сторона в px. По умолчанию 24 (канон-размер шапки FoodActionCard);
   * деталь-шапка food-entry прокидывает `size={20}`. Прокидывается напрямую,
   * CSS у потребителя может переопределить.
   */
  size?: number;
}

// Контурный ⓘ-глиф: тонкий круг (opacity 0.5 — тихая обводка) + serif-italic «i».
// Свёл два bespoke-дубля (FoodActionCard 24×24, FoodEntryEditModals 20×20
// aria-hidden) в один атом. viewBox фиксирован 24×24; масштаб через width/height.
export function InfoIcon({ size = 24, ...rest }: InfoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: 'var(--sys-text-family-serif)' }}
        fontStyle="italic"
        fontSize="16"
        fontWeight="300"
      >
        i
      </text>
    </svg>
  );
}

export default InfoIcon;
