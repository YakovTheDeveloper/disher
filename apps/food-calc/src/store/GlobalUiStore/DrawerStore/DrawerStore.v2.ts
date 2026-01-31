import { ActiveDrawerState, DrawerOpenArgs } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { types, Instance } from 'mobx-state-tree';

const DrawerPayloadModel = types.model('DrawerPayload', {
    title: types.optional(types.string, ''),
    message: types.optional(types.string, ''),
});

const ActiveDrawerModel = types.model('ActiveDrawer', {
    type: types.string,
    payload: types.maybe(DrawerPayloadModel),
});

// MST Model
export const DrawerStoreV2 = types
    .model('DrawerStoreV2', {
        _activeDrawer: types.maybe(ActiveDrawerModel),
        _isOpen: types.optional(types.boolean, false),
    })
    .views(self => ({
        get activeDrawer(): ActiveDrawerState | null {
            if (!self._activeDrawer) return null;
            return {
                type: self._activeDrawer.type,
                payload: self._activeDrawer.payload,
            };
        },

        get isOpen(): boolean {
            return self._isOpen;
        },

        get activeType(): string | null {
            return self._activeDrawer?.type ?? null;
        },
    }))
    .actions(self => ({
        open<T extends Record<string, unknown>>(args: DrawerOpenArgs<T>): void {
            const payload = args.payload as Record<string, unknown> | undefined;
            self._activeDrawer = ActiveDrawerModel.create({
                type: args.type,
                payload: payload ? DrawerPayloadModel.create({
                    title: String(payload.title ?? ''),
                    message: String(payload.message ?? ''),
                }) : undefined,
            });
            self._isOpen = true;
        },

        close(): void {
            self._activeDrawer = undefined;
            self._isOpen = false;
        },

        toggle(): void {
            if (self._isOpen) {
                this.close();
            } else if (self._activeDrawer) {
                self._isOpen = true;
            }
        },

        reset(): void {
            self._activeDrawer = undefined;
            self._isOpen = false;
        },
    }));

export type DrawerStoreInstance = Instance<typeof DrawerStoreV2>;