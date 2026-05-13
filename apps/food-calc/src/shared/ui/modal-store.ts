import { create } from 'zustand';
import React from 'react';
import type { BaseModalProps } from './overlay-types';
import {
  pushOverlayEntry,
  popOverlayEntry,
  registerCloseHandler,
  unregisterCloseHandler,
  isPopstateClosing,
} from '@/shared/lib/overlay-history';

type InferResult<P> = P extends { onClose: (result?: infer R) => void } ? R : void;

// Two-phase open + two-phase close:
//
// OPEN (load-bearing for the enter animation):
// Base UI's `useTransitionStatus` initializes `mounted = useState(open)`. If Dialog.Root
// mounts with `open={true}` from frame 1, `mounted` is `true` immediately, the
// `if (open && !mounted) setTransitionStatus('starting')` branch never fires, and
// `data-starting-style` is never set → no enter animation. We work around that with a
// `mounting` phase that maps to `open={false}` for one frame, then flips to `open={true}`
// on the next rAF — Base UI sees the false→true transition and applies the starting
// attribute.
//
// CLOSE:
// 1. `close(id)` flips phase → 'closing'. ModalManager re-renders Dialog.Root with open=false,
//    Base UI plays its exit transition.
// 2. Manager passes `onOpenChangeComplete` to Dialog.Root. When Base UI signals animation
//    finished, it calls `finishClose(id)`, which fully removes the instance.
// No magic timer — exit duration is governed by the real CSS transition.

interface ModalInstance {
  id: string;
  Component: React.ComponentType<any>;
  props: any;
  resolve: (value: any) => void;
  historyHandler: () => void;
  phase: 'mounting' | 'open' | 'closing';
}

interface ModalState {
  instances: ModalInstance[];
}

const useModalStore = create<ModalState>(() => ({
  instances: [],
}));

function show<P extends BaseModalProps<any>>(
  Component: React.ComponentType<P>,
  props: Omit<P, 'onClose'>,
): Promise<InferResult<P> | undefined> {
  return new Promise((resolve) => {
    const id = Math.random().toString(36).slice(2, 9);
    const historyHandler = () => closeLast();
    pushOverlayEntry();
    registerCloseHandler(historyHandler);
    useModalStore.setState((state) => ({
      instances: [
        ...state.instances,
        { id, Component, props, resolve, historyHandler, phase: 'mounting' },
      ],
    }));
    // Flip to 'open' on next rAF — see modal-store.ts header comment. Dialog.Root
    // must observe a false→true transition for Base UI to apply [data-starting-style].
    requestAnimationFrame(() => {
      useModalStore.setState((state) => ({
        instances: state.instances.map((i) =>
          i.id === id && i.phase === 'mounting' ? { ...i, phase: 'open' } : i,
        ),
      }));
    });
  });
}

function close(id: string, result?: any) {
  const instance = useModalStore.getState().instances.find((i) => i.id === id);
  if (!instance) return;
  if (instance.phase === 'closing') return; // already closing, awaiting animation

  unregisterCloseHandler(instance.historyHandler);
  instance.resolve(result);

  // Closing during the 'mounting' frame: Dialog.Root never reached open=true, so
  // Base UI won't fire onOpenChangeComplete for a false→false transition.
  if (instance.phase === 'mounting') {
    useModalStore.setState((state) => ({
      instances: state.instances.filter((i) => i.id !== id),
    }));
    if (!isPopstateClosing()) {
      void popOverlayEntry().catch(() => {});
    }
    return;
  }

  useModalStore.setState((state) => ({
    instances: state.instances.map((i) => (i.id === id ? { ...i, phase: 'closing' } : i)),
  }));

  if (!isPopstateClosing()) {
    void popOverlayEntry().catch(() => {});
  }
}

// Called from ModalManager when Dialog.Root.onOpenChangeComplete fires with open=false.
function finishClose(id: string) {
  useModalStore.setState((state) => ({
    instances: state.instances.filter((i) => i.id !== id),
  }));
}

function closeLast(result?: any) {
  const open = useModalStore
    .getState()
    .instances.filter((i) => i.phase === 'open' || i.phase === 'mounting');
  if (open.length > 0) {
    close(open[open.length - 1].id, result);
  }
}

export function useModals() {
  const instances = useModalStore((s) => s.instances);
  return { instances, show, close, closeLast, finishClose, isOpen: instances.length > 0 };
}

export const modalStore = { show, close, closeLast };
