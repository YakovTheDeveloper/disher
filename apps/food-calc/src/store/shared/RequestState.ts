import { types } from "mobx-state-tree";

export const RequestState = types.model("RequestState", {
    loading: types.boolean,
    error: types.maybe(types.string),
    code: types.maybe(types.number),
})