import { types } from "mobx-state-tree";

export const RequestState = types
    .model("RequestState", {
        loading: types.boolean,
        error: types.maybe(types.string),
        code: types.maybe(types.number),
    })
    .actions((self) => ({
        setLoading(loading: boolean) {
            self.loading = loading;
        },
        setError(error: string) {
            self.error = error;
        },
        setCode(code: number) {
            self.code = code;
        },
        // Optional: a reset method
        reset() {
            self.loading = false;
            self.error = undefined;
            self.code = undefined;
        },
    }));
