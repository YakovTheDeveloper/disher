import React from "react";

/**
 * Base props for drawer components managed by DrawerStore.
 * All drawers must accept onClose callback.
 *
 * `R = any` (not `unknown`): the default is what a drawer that never declares a
 * result gets, and its `onClose()` must stay callable with whatever the caller
 * has. Under `unknown` the store's `show<P extends BaseDrawerProps<any>>`
 * constraint would stop matching those drawers.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- default R for result-less drawers
export interface BaseDrawerProps<R = any> {
  onClose: (result?: R) => void;
}

/**
 * Base props for modal components managed by ModalStore.
 * All modals must accept onClose callback. `R = any` for the same reason as
 * BaseDrawerProps above.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- default R for result-less modals
export interface BaseModalProps<R = any> {
  onClose: (result?: R) => void;
}

export type OverlayComponentProps<T> = T extends React.ComponentType<infer P>
  ? Omit<P, keyof BaseDrawerProps>
  : never;

/** Which viewport edge a drawer is anchored to. */
export type DrawerSide = 'bottom' | 'left' | 'right';

/** Per-drawer presentation options passed to `drawerStore.show()`. */
export interface DrawerOptions {
  /**
   * Viewport edge the drawer slides in from.
   * @default 'bottom'
   */
  side?: DrawerSide;
  /**
   * CSS length for side drawers, e.g. `'min(88vw, 380px)'`.
   * Ignored when `side` is `'bottom'`.
   */
  width?: string;
  /**
   * Trap focus inside the drawer (default). Set `false` for drawers whose
   * content delegates focus to a `<label htmlFor>` target OUTSIDE the drawer
   * portal (ItemActionsDrawer edit medals → FoodEntryEditModals inputs): a
   * focus trap would bounce the delegation back and the drawer could never
   * hand off / close. `false` maps to Base UI `modal={false}` — scroll-lock is
   * already off under `trap-focus`, so this only releases the focus trap;
   * outside-click dismissal still fires.
   * @default true
   */
  trapFocus?: boolean;
  /**
   * Let the page BEHIND the drawer stay interactive: drop the backdrop scrim AND
   * its pointer-blocking, so taps/drags reach the content under the sheet (e.g.
   * the hero cover behind WallpaperDrawer — for live pan/zoom). Sets the backdrop
   * `pointer-events: none` + transparent. Under `modal:'trap-focus'` (our default)
   * Base UI adds no internal pointer wall, so this alone frees the page. Trade-off:
   * with a click-through backdrop, tap-on-scrim-to-close no longer fires (the
   * backdrop can't be the outside-press target) — closing stays via the Close
   * cross / swipe-down / Escape, and a hero tap no longer closes the sheet (wanted
   * for pan/zoom). Opacity ALONE never sufficed — a transparent fixed backdrop
   * still catches every click; the `pointer-events` drop is the load-bearing half.
   * @default false
   */
  interactiveBehind?: boolean;
}

/** Drawer options after defaults are applied — what the manager/context carry. */
export interface ResolvedDrawerOptions {
  side: DrawerSide;
  width?: string;
  /** Undefined ⇒ trap focus (default). Only an explicit `false` releases it. */
  trapFocus?: boolean;
  /** Undefined ⇒ dimmed + pointer-blocking backdrop (default). `true` ⇒ page behind stays live. */
  interactiveBehind?: boolean;
}
