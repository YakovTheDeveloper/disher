import type { Analysis, StartArgs } from '../api';
import { rangeDayKeys } from './range';

/**
 * Args to restart an analysis over the SAME window with the SAME hypotheses
 * snapshot — fed straight into `startAnalysis`. Pure / unit-tested.
 *
 * The window endpoints are ISO timestamps from the server; `rangeDayKeys`
 * parses them and `startAnalysis` / the backend re-parse them too.
 */
export function restartArgs(analysis: Analysis): StartArgs {
  return {
    windowStart: analysis.windowStart,
    windowEnd: analysis.windowEnd,
    dayKeys: rangeDayKeys({
      start: analysis.windowStart,
      end: analysis.windowEnd,
    }),
    ...(analysis.appliedHypotheses.length > 0
      ? { hypotheses: analysis.appliedHypotheses }
      : {}),
  };
}
