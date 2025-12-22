import { flow, IAnyModelType, Instance } from "mobx-state-tree";
import { RequestState } from "@/store/shared/RequestState";
import { StatusModel } from "@/store/common/pureFabrication/StatusModel";
import { FlowReturn } from "mobx-state-tree/dist/internal";
import { runInAction } from "mobx";

type Key = string | number; // accept both; normalize at runtime

export class RequestAndSetHandler<
    TModelType extends IAnyModelType,
    TSnapshot,
    TStore extends {
        data: Map<Key, Instance<TModelType>>;
        status: Instance<typeof StatusModel>;
    }
> {
    private readonly store: TStore;

    constructor(store: TStore) {
        this.store = store;
    }

    // Ensure a RequestState exists for given ID+variant
    private ensureRequest = (rawId: Key, variant: keyof Instance<typeof StatusModel>) => {
        const id = String(rawId); // normalize key to string

        const variantMap = this.store.status[variant]; // get the map for the variant
        if (!variantMap.has(id as any)) {
            variantMap.set(
                id as any,
                RequestState.create({ loading: false, error: undefined })
            );
        }

        return variantMap.get(id as any)! as Instance<typeof RequestState>;
    };

    async load<R>(
        fetchStatus:
            | { id: Key; variant: keyof Instance<typeof StatusModel> }
            | Array<{ id: Key; variant: keyof Instance<typeof StatusModel> }>,
        request: () => Promise<R>
    ): Promise<R | null> {
        const handler = this;
        const statuses = Array.isArray(fetchStatus) ? fetchStatus : [fetchStatus];
        const states = statuses.map(s => handler.ensureRequest(s.id, s.variant));

        // ✔ Мутация стейта — через runInAction
        runInAction(() => {
            states.forEach(state => {
                state.setLoading(true);
                state.setError("");
            });
        });

        try {
            const result: R = await request();

            if (result == null) {
                runInAction(() => {
                    states.forEach(state => state.setError("not found"));
                });
                return null;
            }

            return result;
        } catch (e) {
            const err = String(e);

            runInAction(() => {
                states.forEach(state => state.setError(err));
            });

            return null;
        } finally {
            runInAction(() => {
                states.forEach(state => state.setLoading(false));
            });
        }
    }

}
