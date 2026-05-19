import { createContext, useContext } from 'react';
import type { ResolvedDrawerOptions } from '../overlay-types';

/**
 * Carries the drawer's anchor edge + width from DrawerManager down to
 * DrawerLayout. The side is decided at `drawerStore.show(..., { side })` call
 * time — not inside the drawer component — so it can't be a plain prop without
 * threading it through every drawer's props. The manager always provides this;
 * the `'bottom'` default only covers a DrawerLayout rendered outside a manager.
 */
const DrawerSideContext = createContext<ResolvedDrawerOptions>({ side: 'bottom' });

/** Wraps each open drawer instance — set by DrawerManager. */
export const DrawerSideProvider = DrawerSideContext.Provider;

/** Read inside DrawerLayout to pick bottom/left/right geometry. */
export const useDrawerSide = (): ResolvedDrawerOptions => useContext(DrawerSideContext);
