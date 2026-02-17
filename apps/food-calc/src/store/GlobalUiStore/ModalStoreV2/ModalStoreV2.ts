import { makeAutoObservable } from "mobx";
import React from "react";
import { BaseModalProps } from "./types";

interface ModalInstance {
  id: string;
  Component: React.ComponentType<any>;
  props: any;
  resolve: (value: any) => void;
}

export class ModalStoreV2 {
  instances: ModalInstance[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Открывает модальное окно и возвращает Promise с результатом
   * @param Component - React компонент модалки
   * @param props - Пропсы компонента (onClose исключен, его добавит стор)
   */
  show<P extends BaseModalProps<R>, R = any>(
    Component: React.ComponentType<P>,
    props: Omit<P, keyof BaseModalProps>
  ): Promise<R | undefined> {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).slice(2, 9);
      
      this.instances.push({
        id,
        Component,
        props,
        resolve,
      });
    });
  }

  // Закрывает конкретную модалку и резолвит промис
  close(id: string, result?: any) {
    const index = this.instances.findIndex((i) => i.id === id);
    if (index !== -1) {
      this.instances[index].resolve(result);
      this.instances.splice(index, 1);
    }
  }

  // Закрывает последнюю модалку
  closeLast(result?: any) {
    if (this.instances.length > 0) {
      const last = this.instances[this.instances.length - 1];
      this.close(last.id, result);
    }
  }

  // Проверка наличия открытых модалок
  get isModalOpen() {
    return this.instances.length > 0;
  }
}

export const modalStoreV2 = new ModalStoreV2();
