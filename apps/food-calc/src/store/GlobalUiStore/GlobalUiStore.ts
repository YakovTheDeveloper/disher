import { types, Instance } from "mobx-state-tree";
import { DrawerStoreV2 } from "./DrawerStore/DrawerStore.v2";
import { ScrollStore } from "./ScrollStore/ScrollStore";
import { UIViewOptions } from "./UiViewOptions/UiViewOptions";
import { UserAgentStore } from "./UserAgentStore/UserAgentStore";

export const GlobalUiStore = types
    .model("GlobalUiStore", {
        drawerStore: types.optional(DrawerStoreV2, {}),
        scrollStore: types.optional(ScrollStore, {}),
        options: types.optional(UIViewOptions, {}),
        userAgentStore: types.optional(UserAgentStore, {}),
    })
    .actions(self => ({
    }));

export type GlobalUiStoreInstance = Instance<typeof GlobalUiStore>;
