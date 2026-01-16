import { types, Instance } from "mobx-state-tree";

export const ScrollStore = types
    .model("ScrollStore", {
    })
    .volatile(() => ({
        positions: new Map<string, number>(),
    }))
    .actions(self => ({
        setPosition(key: string, value: number) {
            self.positions.set(key, value);
        },
    }))
    .views(self => ({
        getPosition(key: string): number {
            return self.positions.get(key) || 0;
        },
    }));

export type ScrollStoreInstance = Instance<typeof ScrollStore>;
