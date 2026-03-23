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

interface ModalInstance {
  id: string;
  Component: React.ComponentType<any>;
  props: any;
  resolve: (value: any) => void;
  historyHandler: () => void;
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
      instances: [...state.instances, { id, Component, props, resolve, historyHandler }],
    }));
  });
}

function close(id: string, result?: any) {
  const instance = useModalStore.getState().instances.find((i) => i.id === id);
  if (instance) {
    unregisterCloseHandler(instance.historyHandler);
    if (!isPopstateClosing()) popOverlayEntry();
    instance.resolve(result);
    useModalStore.setState((state) => ({
      instances: state.instances.filter((i) => i.id !== id),
    }));
  }
}

function closeLast(result?: any) {
  const { instances } = useModalStore.getState();
  if (instances.length > 0) {
    close(instances[instances.length - 1].id, result);
  }
}

export function useModals() {
  const instances = useModalStore((s) => s.instances);
  return { instances, show, close, closeLast, isOpen: instances.length > 0 };
}

export const modalStore = { show, close, closeLast };
