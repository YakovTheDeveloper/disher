import { drawerStore } from '@/shared/ui';
import HypothesesDrawer from './HypothesesDrawer';

// Open the shared «Гипотезы» bottom-sheet. Single entry point reused by both
// HomePage (Laboratory) and the Analyses page bottom bars — there is no longer
// an inline hypotheses screen / `/analyses` slide (2026-06-13).
export const openHypotheses = (): Promise<void | undefined> =>
  drawerStore.show(HypothesesDrawer, {});
