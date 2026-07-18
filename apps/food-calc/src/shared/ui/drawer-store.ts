import { create } from 'zustand';
import React from 'react';
import type { BaseDrawerProps, DrawerOptions, ResolvedDrawerOptions } from './overlay-types';
import { registerCloseHandler, unregisterCloseHandler } from '@/shared/lib/overlay-history';

type InferResult<P> = P extends { onClose: (result?: infer R) => void } ? R : void;

// Two-phase open + two-phase close:
//
// OPEN (this is the load-bearing part for the slide-up animation):
// Base UI's `useTransitionStatus` initializes `mounted = useState(open)`. If Drawer.Root
// mounts with `open={true}` from frame 1, `mounted` is `true` immediately, the
// `if (open && !mounted) setTransitionStatus('starting')` branch never fires, and
// `data-starting-style` is never set → no enter animation. We work around that with a
// `mounting` phase that maps to `open={false}` for one frame, then flips to `open={true}`
// on the next rAF — Base UI sees the false→true transition and applies the starting
// attribute.
//
// CLOSE:
// 1. `close(id)` flips phase → 'closing'. DrawerManager re-renders Drawer.Root with open=false,
//    Base UI plays its exit transition.
// 2. Manager passes `onOpenChangeComplete` to Drawer.Root. When Base UI signals animation
//    finished, it calls `finishClose(id)`, which fully removes the instance.
// No magic timer — exit duration is governed by the real CSS transition.

// Heterogeneous registry — one array, mutually unrelated prop types per entry.
// The erased `any` stands in for an existential P that TS can't express; safety
// lives at the `show<P>()` boundary. Full reasoning in modal-store.ts, which is
// the same shape.
/* eslint-disable @typescript-eslint/no-explicit-any -- existential P, see modal-store.ts */
interface DrawerInstance {
  id: string;
  Component: React.ComponentType<any>;
  props: any;
  resolve: (value: any) => void;
  historyHandler: () => void;
  phase: 'mounting' | 'open' | 'closing';
  // Side/width after defaults applied. DrawerManager turns `side` into the
  // Base UI `swipeDirection` and feeds the whole thing into DrawerSideContext,
  // which DrawerLayout reads to pick its geometry.
  options: ResolvedDrawerOptions;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface DrawerState {
  instances: DrawerInstance[];
}

const useDrawerStore = create<DrawerState>(() => ({
  instances: [],
}));

// Constraint must admit a drawer declaring ANY result type — `BaseDrawerProps<unknown>`
// would only match those whose onClose takes unknown. P itself is inferred exactly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- constraint must admit every R
function show<P extends BaseDrawerProps<any>>(
  Component: React.ComponentType<P>,
  props: Omit<P, 'onClose'>,
  options?: DrawerOptions,
): Promise<InferResult<P> | undefined> {
  return new Promise((resolve) => {
    // Ambient (`interactiveBehind`) drawers coexist with the PAGE, not with other
    // drawers: their backdrop is transparent + click-through, so the live page behind
    // can open a NEW drawer while the ambient one lingers underneath — and that same
    // click-through backdrop means an outside tap can't dismiss it. So when any drawer
    // opens, retire still-open ambient drawers first (e.g. WallpaperDrawer yields the
    // moment a drawer opens from the hero page behind it).
    for (const inst of useDrawerStore.getState().instances) {
      if (inst.options.interactiveBehind && inst.phase !== 'closing') close(inst.id);
    }
    const id = Math.random().toString(36).slice(2, 9);
    const historyHandler = () => closeLast();
    registerCloseHandler(historyHandler);
    const resolvedOptions: ResolvedDrawerOptions = {
      side: options?.side ?? 'bottom',
      width: options?.width,
      trapFocus: options?.trapFocus ?? true,
      interactiveBehind: options?.interactiveBehind ?? false,
    };
    useDrawerStore.setState((state) => ({
      instances: [
        ...state.instances,
        {
          id,
          Component,
          props,
          resolve,
          historyHandler,
          phase: 'mounting',
          options: resolvedOptions,
        },
      ],
    }));
    // Flip to 'open' on the next animation frame so Base UI's Drawer.Root re-renders
    // with open: false → true. That transition is what makes useTransitionStatus fire
    // setTransitionStatus('starting') and apply [data-starting-style] on the popup,
    // which the slide-up CSS transition keys off of. See drawer-store.ts header comment.
    requestAnimationFrame(() => {
      useDrawerStore.setState((state) => ({
        instances: state.instances.map((i) =>
          i.id === id && i.phase === 'mounting' ? { ...i, phase: 'open' } : i,
        ),
      }));
    });
  });
}

// close(id) is called from the manager and from history pops — they know the id,
// not which drawer's R it belongs to. The value goes straight to that instance's
// own resolve().
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- caller can't know R from an id
function close(id: string, result?: any) {
  const instance = useDrawerStore.getState().instances.find((i) => i.id === id);
  if (!instance) return;
  if (instance.phase === 'closing') return;

  unregisterCloseHandler(instance.historyHandler);
  instance.resolve(result);

  // Closing during the 'mounting' frame: Drawer.Root never reached open=true, so
  // Base UI won't fire onOpenChangeComplete for a false→false transition. Skip the
  // exit animation and drop the instance directly.
  if (instance.phase === 'mounting') {
    useDrawerStore.setState((state) => ({
      instances: state.instances.filter((i) => i.id !== id),
    }));
    return;
  }

  useDrawerStore.setState((state) => ({
    instances: state.instances.map((i) => (i.id === id ? { ...i, phase: 'closing' } : i)),
  }));
}

function finishClose(id: string) {
  useDrawerStore.setState((state) => ({
    instances: state.instances.filter((i) => i.id !== id),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same as close(): R unknown at the call site
function closeLast(result?: any) {
  const open = useDrawerStore
    .getState()
    .instances.filter((i) => i.phase === 'open' || i.phase === 'mounting');
  if (open.length > 0) {
    close(open[open.length - 1].id, result);
  }
}

// Hard-drop every instance. Used on sign-out: when AuthGate unmounts the app
// subtree, DrawerManager goes with it and can never call `finishClose`, so any
// open drawer would orphan its instance here forever. Resolve pending promises
// (undefined) and unregister history handlers so nothing leaks.
function reset() {
  for (const i of useDrawerStore.getState().instances) {
    unregisterCloseHandler(i.historyHandler);
    i.resolve(undefined);
  }
  useDrawerStore.setState({ instances: [] });
}

export function useDrawers() {
  const instances = useDrawerStore((s) => s.instances);
  return { instances, show, close, closeLast, finishClose, isOpen: instances.length > 0 };
}

export const drawerStore = { show, close, closeLast, reset };
