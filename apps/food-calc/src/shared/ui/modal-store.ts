import { makeAutoObservable } from "mobx";
import React from "react";
import type { BaseModalProps } from "./overlay-types";

interface ModalInstance {
  id: string;
  Component: React.ComponentType<any>;
  props: any;
  resolve: (value: any) => void;
}

export class ModalStore {
  instances: ModalInstance[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  show<P extends BaseModalProps<R>, R = any>(
    Component: React.ComponentType<P>,
    props: Omit<P, keyof BaseModalProps>,
  ): Promise<R | undefined> {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).slice(2, 9);
      this.instances.push({ id, Component, props, resolve });
    });
  }

  close(id: string, result?: any) {
    const index = this.instances.findIndex((i) => i.id === id);
    if (index !== -1) {
      this.instances[index].resolve(result);
      this.instances.splice(index, 1);
    }
  }

  closeLast(result?: any) {
    if (this.instances.length > 0) {
      const last = this.instances[this.instances.length - 1];
      this.close(last.id, result);
    }
  }

  get isModalOpen() {
    return this.instances.length > 0;
  }
}

export const modalStore = new ModalStore();
