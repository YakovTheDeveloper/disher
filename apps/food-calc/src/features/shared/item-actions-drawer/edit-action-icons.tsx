// Тематические глифы для рядов правок ItemActionsDrawer — по одному на смысл
// действия (количество · уточнения · время · особенности). Семантику маппит
// консумер (FoodSchedule/ScheduleEvents кладут нужный icon в свой ItemAction),
// дровер рисует его в икон-слоте SettingRow.
//
// Стиль — жирный ЗАЛИТЫЙ силуэт с редкими прорезями (fill-rule evenodd), калька
// канона гравюр WriteBar (food-variants/event-variants: плотная масса, минимум
// тонких штрихов) — рядом со строчными глифами (урна, колба) читается плотным
// чёрным монохромом. fill=currentColor → красит слот SettingRow (cold-icon).

const ICON_PROPS = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
} as const;

const FILL = { fill: 'currentColor' } as const;

/** Количество — торговые весы (мотив fv-scale из DesignBar): стойка, коромысло,
 *  две чаши на подвесах, база-трапеция. Минималистично: без товара на чашах и
 *  без бейджа-плюса оригинала. Подвесы — тонкие stroke-треугольники, как в
 *  fv-scale (единственное место, где канон заливки уступает штриху). */
export const QuantityIcon = () => (
  <svg {...ICON_PROPS}>
    {/* стойка + набалдашник */}
    <path d="M12 3.6a1 1 0 1 0 .01 0 1 1 0 0 0-.01 0z" {...FILL} />
    <path d="M11.3 5h1.4v11h-1.4z" {...FILL} />
    {/* коромысло */}
    <path d="M5 6.4h14a.6.6 0 0 1 0 1.2H5a.6.6 0 0 1 0-1.2z" {...FILL} />
    {/* подвесы — треугольники-штрихи (как stroke 16 в fv-scale) */}
    <path d="M4.6 7.6L7 11.4L9.4 7.6" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.6 7.6L17 11.4L19.4 7.6" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    {/* чаши — полукупола */}
    <path d="M3.5 11.4a3.5 2 0 0 0 7 0z" {...FILL} />
    <path d="M13.5 11.4a3.5 2 0 0 0 7 0z" {...FILL} />
    {/* база-трапеция */}
    <path d="M8.6 16h6.8l1.7 3.6a.6.6 0 0 1-.54.86H7.44a.6.6 0 0 1-.54-.86L8.6 16z" {...FILL} />
  </svg>
);

/** Уточнения — плотная реплика-выноска со строчками-прорезями (аннотация). */
export const NoteIcon = () => (
  <svg {...ICON_PROPS}>
    <path
      fillRule="evenodd"
      d="M12 3c-5 0-9 3-9 7 0 2.2 1.2 4.1 3 5.4V20l3.6-2.7c.7.1 1.5.2 2.4.2 5 0 9-3 9-7s-4-7.5-9-7.5z M7.5 8.3h9v1.6h-9z M7.5 11h6v1.6h-6z"
      {...FILL}
    />
  </svg>
);

/** Время — монолитный циферблат, стрелки выкушены прорезью. */
export const ClockIcon = () => (
  <svg {...ICON_PROPS}>
    <path
      fillRule="evenodd"
      d="M12 3.5a8.5 8.5 0 1 0 .01 0 8.5 8.5 0 0 0-.01 0z M11.2 7.2h1.6v5h-1.6z M11.4 11.1l4.5 1.7-.6 1.5-4.4-1.7z"
      {...FILL}
    />
  </svg>
);

/** Особенности — три жирные дорожки-ползунка с кольцевыми бегунками. */
export const FeaturesIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M3 5.2h18v1.6H3zM3 11.2h18v1.6H3zM3 17.2h18v1.6H3z" {...FILL} />
    <path fillRule="evenodd" d="M8 3.6a2.4 2.4 0 1 0 .01 0 2.4 2.4 0 0 0-.01 0z M8 5a1 1 0 1 0 .01 0A1 1 0 0 0 8 5z" {...FILL} />
    <path fillRule="evenodd" d="M15 9.6a2.4 2.4 0 1 0 .01 0 2.4 2.4 0 0 0-.01 0z M15 11a1 1 0 1 0 .01 0 1 1 0 0 0-.01 0z" {...FILL} />
    <path fillRule="evenodd" d="M9 15.6a2.4 2.4 0 1 0 .01 0 2.4 2.4 0 0 0-.01 0z M9 17a1 1 0 1 0 .01 0A1 1 0 0 0 9 17z" {...FILL} />
  </svg>
);
