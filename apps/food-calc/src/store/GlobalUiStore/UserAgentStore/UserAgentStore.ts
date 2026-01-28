import { types, Instance } from "mobx-state-tree";

export const UserAgentStore = types.model("UserAgentStore", {
    isIOS: types.optional(types.boolean, false),
    isAndroid: types.optional(types.boolean, false),
    engine: types.optional(types.string, ''),
    supportsAutofocus: types.optional(types.boolean, true),
}).actions(self => ({
    setIsIOS(isIOS: boolean) {
        self.isIOS = isIOS;
    },
    setIsAndroid(isAndroid: boolean) {
        self.isAndroid = isAndroid;
    },
    setEngine(engine: string) {
        self.engine = engine;
    },
    setSupportsAutofocus(supportsAutofocus: boolean) {
        self.supportsAutofocus = supportsAutofocus;
    },
}));

export type UserAgentStoreInstance = Instance<typeof UserAgentStore>;