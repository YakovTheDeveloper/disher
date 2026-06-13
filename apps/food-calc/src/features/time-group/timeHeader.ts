/**
 * Design-variant contract for the `TimeGroup` header — the time label that sits
 * above each cluster of schedule rows. One DesignBar anchor (`TimeHeader`),
 * mounted in BOTH `FoodSchedule` and `ScheduleEvents`, drives the look across
 * food + event screens (same key → shared `localStorage["dv:TimeHeader"]`),
 * mirroring the dual-mount `RowBoundary` and `ScheduleFood` anchors.
 *
 * The CSS lives in `TimeGroup.module.scss` (variant blocks keyed on
 * `:global([data-dv='TimeHeader'][data-dv-v='…'])`). The header also publishes
 * `data-tg-tod` (morning|day|evening|night) so a variant can deepen its tint
 * toward night, matching the rows' time-of-day progression.
 *
 * First entry is the production default (the dev bar only shows in dev / `?dv=1`,
 * so prod users see `variants[0]`).
 */
export const TIME_HEADER_KEY = 'TimeHeader';

export const TIME_HEADER_VARIANTS = [
  'hidden', // no header at all — the list reads as one quiet run (production default)
  'alice', // the house serif (Alice) at display size — matches the heading canon
  'serif', // Source-Serif italic, section-heading size + a fading hairline rule
  'clock', // Onest tabular numerals (dial face) — wide tracking, low contrast
  'period', // serif-italic time + the part-of-day word beside it («8:30 · утро»)
] as const;

export type TimeHeaderVariant = (typeof TIME_HEADER_VARIANTS)[number];
