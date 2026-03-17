import { types } from "mobx-state-tree";

export const UIViewOptions = types
    .model("UIViewOptions", {
        timePickerVariant: types.optional(types.enumeration("TimePickerVariant", ["native", "default"]), 'default'),
        showCost: types.optional(types.boolean, false),
    })
    .actions(self => ({
        setTimePickerVariant(variant: "native" | "default") {
            self.timePickerVariant = variant;
        },
        toggleTimePickerVariant() {
            self.timePickerVariant = self.timePickerVariant === "native" ? "default" : "native";
        },
        toggleShowCost() {
            self.showCost = !self.showCost;
        },
    }));

export type UIViewOptionsInstance = typeof UIViewOptions.Type;