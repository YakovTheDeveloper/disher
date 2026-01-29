/**
 * DrawerStore V2 - simplified store with code splitting support
 * Uses simple MobX instead of MST for simplicity
 */

import { makeAutoObservable } from 'mobx';
import { ActiveDrawerState, DrawerOpenArgs } from '@/types/common/drawer.v2';

class DrawerStoreV2 {
    private _activeDrawer: ActiveDrawerState | null = null;
    private _isOpen = false;

    constructor() {
        makeAutoObservable(this);
    }

    get activeDrawer(): ActiveDrawerState | null {
        return this._activeDrawer;
    }

    get isOpen(): boolean {
        return this._isOpen;
    }

    get activeType(): string | null {
        return this._activeDrawer?.type ?? null;
    }

    open<T = unknown>(args: DrawerOpenArgs<T>): void {
        this._activeDrawer = {
            type: args.type,
            payload: args.payload,
        };
        this._isOpen = true;
    }

    close(): void {
        this._activeDrawer = null;
        this._isOpen = false;
    }

    toggle(): void {
        if (this._isOpen) {
            this.close();
        } else if (this._activeDrawer) {
            this._isOpen = true;
        }
    }

    reset(): void {
        this._activeDrawer = null;
        this._isOpen = false;
    }
}

// Singleton instance
export const drawerStoreV2 = new DrawerStoreV2();

// Hook for React components
export function useDrawerStoreV2() {
    return drawerStoreV2;
}