import React from "react";

/**
 * Base props for drawer components managed by DrawerStore.
 * All drawers must accept onClose callback.
 */
export interface BaseDrawerProps<R = any> {
  onClose: (result?: R) => void;
}

/**
 * Base props for modal components managed by ModalStore.
 * All modals must accept onClose callback.
 */
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
}

/** Drawer options after defaults are applied — what the manager/context carry. */
export interface ResolvedDrawerOptions {
  side: DrawerSide;
  width?: string;
}
