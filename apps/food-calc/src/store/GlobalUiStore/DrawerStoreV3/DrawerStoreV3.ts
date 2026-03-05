import { makeAutoObservable } from 'mobx';
import React from 'react';
import { BaseDrawerProps } from './types';

interface DrawerInstance {
    id: string;
    Component: React.ComponentType<any>;
    props: any;
    resolve: (value: any) => void;
}

export class DrawerStoreV3 {
    instances: DrawerInstance[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    /**
     * Открывает drawer и возвращает Promise с результатом
     * @param Component - React компонент drawer
     * @param props - Пропсы компонента (onClose исключен, его добавит стор)
     */
    show<P extends BaseDrawerProps<R>, R = any>(
        Component: React.ComponentType<P>,
        props: Omit<P, keyof BaseDrawerProps>
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

    // Закрывает конкретный drawer и резолвит промис
    close(id: string, result?: any) {
        const index = this.instances.findIndex((i) => i.id === id);
        if (index !== -1) {
            this.instances[index].resolve(result);
            this.instances.splice(index, 1);
        }
    }

    // Закрывает последний drawer
    closeLast(result?: any) {
        if (this.instances.length > 0) {
            const last = this.instances[this.instances.length - 1];
            this.close(last.id, result);
        }
    }

    // Проверка наличия открытых drawer
    get isDrawerOpen() {
        return this.instances.length > 0;
    }
}

export const drawerStoreV3 = new DrawerStoreV3();
