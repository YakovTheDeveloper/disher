import { RequestState } from "@/store/shared/RequestState";
import { types } from "mobx-state-tree";

export const StatusModel = types.model({
    fetchGet: types.map(RequestState),
    fetchSync: types.map(RequestState),
})