/**
 * Design-variant contract for how adjacent rows in a `TimeGroup` meet at their
 * shared edge. One DesignBar anchor (`RowBoundary`), mounted in BOTH
 * `FoodSchedule` and `ScheduleEvents`, drives the look for food + event rows
 * consistently (same key → shared `localStorage["dv:RowBoundary"]`), mirroring
 * the existing dual-mount `ScheduleFood` palette anchor.
 *
 * The CSS lives in two files (the boundary spans both):
 *   - `TimeGroup.module.scss`     — gap / radius / perimeter / fading divider
 *   - `LongPressRow.module.scss`  — reads `--row-rest-outline-w` / `--row-last-shadow`
 *
 * First entry is the production default. The `-flat` / `-soft` suffixes on
 * merged/rail differ only in whether the group's last row casts a drop shadow
 * (`-soft` = half the original strength).
 */
export const ROW_BOUNDARY_KEY = 'RowBoundary';

export const ROW_BOUNDARY_VARIANTS = [
  'merged-flat', // one soft frame + fading inner hairline, no group shadow (default)
  'merged-soft', // same, group's last row casts a half-strength shadow
  'borderless', // no frame; soft tint blocks parted by a whisper hairline
  'rail-flat', // soft frame + vivid left accent rail (stripe-fork), no group shadow
  'rail-soft', // same rail, group's last row casts a half-strength shadow
  'gutter-time', // borderless + the per-row time leaves the backing into a left gutter (messenger style)
] as const;

export type RowBoundaryVariant = (typeof ROW_BOUNDARY_VARIANTS)[number];
