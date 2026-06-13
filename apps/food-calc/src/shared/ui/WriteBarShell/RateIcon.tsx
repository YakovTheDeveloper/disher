/** Rate glyph — left affordance for the Events write bar («оценка состояния»).
 *  Conveys «add a 1–10 rating». Monochrome (`currentColor`), authored in a 24
 *  viewBox and rendered at 20px (26px when the bar is focused) by `.clip svg`.
 *
 *  The original `stacked` glyph (hollow plus over «1–10») read as visually
 *  heavy — the bold plus fought the tiny label. So the icon is now a
 *  DesignBar-driven set: every variant keeps the «1–10» idea but pairs it with
 *  a calmer, more harmonious scale metaphor. Flip live via the 🎨 DesignBar
 *  (anchor key `EventsRateIcon`). */

/** Variant tuple — first entry is the default. Drives the DesignBar order.
 *  `disc` is the current default (user pick 2026-06-13): a filled round button
 *  with an inverted broken-up arrow — reads clearly as a tap target. The rest
 *  stay switchable in the DesignBar. */
export const RATE_ICON_VARIANTS = [
  'disc',
  'bars',
  'pill',
  'gauge',
  'dots',
  'stacked',
] as const;

export type RateIconVariant = (typeof RATE_ICON_VARIANTS)[number];

const SCALE_LABEL = '1–10';

// Shared italic-serif «1–10» label (matches the other bar glyph typography).
const Label = ({ y, size, fill = 'currentColor' }: { y: number; size: number; fill?: string }) => (
  <text
    x="12"
    y={y}
    textAnchor="middle"
    fill={fill}
    style={{
      fontFamily: 'var(--heading-font)',
      fontStyle: 'italic',
      fontWeight: 600,
      fontSize: `${size}px`,
    }}
  >
    {SCALE_LABEL}
  </text>
);

const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true,
} as const;

/** Clean labelled chip — «1–10» framed by a soft rounded pill. Minimal, the
 *  label is the hero. (Default.) */
const PillGlyph = () => (
  <svg {...svgProps}>
    <rect
      x="2.6"
      y="6.4"
      width="18.8"
      height="11.2"
      rx="5.6"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <Label y={14.4} size={8} />
  </svg>
);

/** Speedometer arc + needle over «1–10» — the literal «rate» metaphor. */
const GaugeGlyph = () => (
  <svg {...svgProps}>
    <path
      d="M4.5 14.6A7.5 7.5 0 0 1 19.5 14.6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 14.6 15.3 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="12" cy="14.6" r="1.2" fill="currentColor" />
    <Label y={22.4} size={7} />
  </svg>
);

/** Ascending bar-chart over «1–10», mounted on a filled rounded-square backdrop
 *  with INVERTED (light) content — reads as a proper app-tile icon rather than a
 *  bare glyph. Backdrop = the bar's accent (`--wb-send`), content = its inverted
 *  fg (`--wb-send-fg`), so it stays themed alongside the send button. Rendered
 *  ~2× larger than the other glyphs (see `.clip[data-dv-v='bars'] svg`). */
const BARS_FG = 'var(--wb-send-fg, #ffffff)';
const BarsGlyph = () => (
  <svg {...svgProps}>
    {/* подложка-плашка */}
    <rect x="1.5" y="1.5" width="21" height="21" rx="6.2" fill="var(--wb-send, #2f80ed)" />
    {/* инверсный контент: растущие столбики (baseline 15) + «1–10» */}
    <rect x="6.2" y="11.0" width="2.0" height="4.0" rx="0.9" fill={BARS_FG} />
    <rect x="9.4" y="9.4" width="2.0" height="5.6" rx="0.9" fill={BARS_FG} />
    <rect x="12.6" y="7.8" width="2.0" height="7.2" rx="0.9" fill={BARS_FG} />
    <rect x="15.8" y="6.2" width="2.0" height="8.8" rx="0.9" fill={BARS_FG} />
    <Label y={20.4} size={6} fill={BARS_FG} />
  </svg>
);

/** Five-step dot scale (mid-point filled) over «1–10». */
const DotsGlyph = () => (
  <svg {...svgProps}>
    {[3.5, 7.75, 12, 16.25, 20.5].map((cx, i) => (
      <circle
        key={cx}
        cx={cx}
        cy="9.4"
        r="1.45"
        fill={i === 2 ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.2"
      />
    ))}
    <Label y={21.4} size={7} />
  </svg>
);

/** Original — hollow rounded plus parked in the top half over «1–10».
 *  The 50-unit PlusIconOutline path scaled to ~11.6px (strokeWidth 7 × 0.232 ≈
 *  1.6px final). Kept for reference / comparison. */
const StackedGlyph = () => (
  <svg {...svgProps}>
    <g transform="translate(6.2 0.6) scale(0.232)">
      <path
        d="M25 0C29.4183 0 33 3.58172 33 8V17H42C46.4183 17 50 20.5817 50 25C50 29.4183 46.4183 33 42 33H33V42C33 46.4183 29.4183 50 25 50C20.5817 50 17 46.4183 17 42V33H8C3.58172 33 0 29.4183 0 25C0 20.5817 3.58172 17 8 17H17V8C17 3.58172 20.5817 0 25 0Z"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinejoin="round"
      />
    </g>
    <Label y={22.5} size={8} />
  </svg>
);

/** Filled accent disc + an inverted (light) broken-line up-arrow (trending up).
 *  Reads as a round, tappable button — like the send coin — instead of a bare
 *  hairline mark; addresses «не похоже на кликабельную иконку». Disc = the bar's
 *  accent (`--wb-send`), content = its inverted fg (`--wb-send-fg`). No «1–10»
 *  label by design. Rendered ~2× the hairline glyphs (see `.clip[data-dv-v='disc']`).
 *  (Default — user pick 2026-06-13.) */
const DiscGlyph = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="10.5" fill="var(--wb-send, #2f80ed)" />
    {/* ломаная стрелка-график вверх (инверсный контент) */}
    <path
      d="M6.4 15 9.8 11.6 12.2 13.6 16.6 8.8"
      stroke={BARS_FG}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.2 8.8 16.6 8.8 16.6 12.2"
      stroke={BARS_FG}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GLYPHS: Record<RateIconVariant, () => JSX.Element> = {
  disc: DiscGlyph,
  pill: PillGlyph,
  gauge: GaugeGlyph,
  bars: BarsGlyph,
  dots: DotsGlyph,
  stacked: StackedGlyph,
};

export const RateIcon = ({ variant = 'disc' }: { variant?: RateIconVariant }) => {
  const Glyph = GLYPHS[variant] ?? DiscGlyph;
  return <Glyph />;
};

export default RateIcon;
