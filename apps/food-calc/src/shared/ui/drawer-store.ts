import { create } from 'zustand';
import React from 'react';
import type { BaseDrawerProps } from './overlay-types';
import {
  pushOverlayEntry,
  popOverlayEntry,
  registerCloseHandler,
  unregisterCloseHandler,
  isPopstateClosing,
} from '@/shared/lib/overlay-history';

type InferResult<P> = P extends { onClose: (result?: infer R) => void } ? R : void;

interface DrawerInstance {
  id: string;
  Component: React.ComponentType<any>;
  props: any;
  resolve: (value: any) => void;
  historyHandler: () => void;
}

interface DrawerState {
  instances: DrawerInstance[];
}

const useDrawerStore = create<DrawerState>(() => ({
  instances: [],
}));

function show<P extends BaseDrawerProps<any>>(
  Component: React.ComponentType<P>,
  props: Omit<P, 'onClose'>,
): Promise<InferResult<P> | undefined> {
  return new Promise((resolve) => {
    const id = Math.random().toString(36).slice(2, 9);
    const historyHandler = () => closeLast();
    pushOverlayEntry();
    registerCloseHandler(historyHandler);
    useDrawerStore.setState((state) => ({
      instances: [...state.instances, { id, Component, props, resolve, historyHandler }],
    }));
  });
}

async function close(id: string, result?: any) {
  const instance = useDrawerStore.getState().instances.find((i) => i.id === id);
  if (instance) {
    unregisterCloseHandler(instance.historyHandler);
    useDrawerStore.setState((state) => ({
      instances: state.instances.filter((i) => i.id !== id),
    }));
    instance.resolve(result);
    if (!isPopstateClosing()) await popOverlayEntry();
  }
}

function closeLast(result?: any) {
  const { instances } = useDrawerStore.getState();
  if (instances.length > 0) {
    close(instances[instances.length - 1].id, result);
  }
}

export function useDrawers() {
  const instances = useDrawerStore((s) => s.instances);
  return { instances, show, close, closeLast, isOpen: instances.length > 0 };
}

export const drawerStore = { show, close, closeLast };
