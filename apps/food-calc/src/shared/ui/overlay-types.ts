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
