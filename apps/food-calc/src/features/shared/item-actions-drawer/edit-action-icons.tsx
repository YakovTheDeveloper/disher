// Тематические глифы для ряда правок ItemActionsDrawer — по одному на смысл
// действия (количество · уточнения · время). Семантику маппит консумер
// (FoodSchedule кладёт нужный icon в свой ItemAction), дровер лишь рисует его в
// углу чипа. Пришли на смену единому карандашу (uniform pencil). Стиль — 26px,
// currentColor, stroke 1.5 round (как урна/крест дровера).

const ICON_PROPS = {
  width: 26,
  height: 26,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
} as const;

const STROKE = {
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Количество — гиря (вес/граммы). */
export const QuantityIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M9 8a3 3 0 1 1 6 0" {...STROKE} />
    <path d="M6.5 8h11l1.2 11.4a1 1 0 0 1-1 1.1H6.3a1 1 0 0 1-1-1.1z" {...STROKE} />
  </svg>
);

/** Уточнения — реплика-выноска со строчками (аннотация/детали). */
export const NoteIcon = () => (
  <svg {...ICON_PROPS}>
    <path
      d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v8A1.5 1.5 0 0 1 18.5 15H10l-4 4v-4H5.5A1.5 1.5 0 0 1 4 13.5z"
      {...STROKE}
    />
    <path d="M8 8h8M8 11h5" {...STROKE} />
  </svg>
);

/** Время — циферблат со стрелками. */
export const ClockIcon = () => (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="8.5" {...STROKE} />
    <path d="M12 7.5V12l3 1.8" {...STROKE} />
  </svg>
);
