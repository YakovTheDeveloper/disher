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
}

/** Drawer options after defaults are applied — what the manager/context carry. */
export interface ResolvedDrawerOptions {
  side: DrawerSide;
  width?: string;
  /** Undefined ⇒ trap focus (default). Only an explicit `false` releases it. */
  trapFocus?: boolean;
}
