import { flow, getType, IAnyModelType, Instance } from "mobx-state-tree"
import { RequestState } from "@/store/shared/RequestState"
import { StatusModel } from "@/store/common/pureFabrication/StatusModel"

type Key = string | number   // accept both at type level; normalize at runtime

export class RequestAndSetHandler<
    TModelType extends IAnyModelType,
    TSnapshot,
    TStore extends {
        data: Map<Key, Instance<TModelType>>
        status: Instance<typeof StatusModel>
    }
> {
    private readonly store: TStore
    private readonly ModelType: TModelType

    constructor(store: TStore) {
        this.store = store
        // @ts-ignore MST map metadata; getChildType exists on map types
        this.ModelType = getType((store as any).data).getChildType()
    }

    private ensureRequest = (rawId: Key, variant: keyof Instance<typeof StatusModel>) => {
        const id = String(rawId) // normalize immediately to string for usage with MST maps

        const variantMap = this.store.status[variant] // grab the map once
        if (!variantMap.has(id as any)) {
            variantMap.set(
                id as any,
                RequestState.create({ loading: false, error: undefined })
            )
        }

        return variantMap.get(id as any)! as Instance<typeof RequestState>
    }

    load(
        fetchStatus: {
            id: string,
            variant: keyof Instance<typeof StatusModel>
        },
        request: () => Promise<{ data: TSnapshot | null }>
    ) {
        const handler = this
        const { id, variant } = fetchStatus

        return flow(function* () {
            const state = handler.ensureRequest(id, variant)
            state.loading = true
            state.error = undefined

            try {
                const result = yield request()

                if (!result?.data) {
                    state.error = "Not found"
                    return null
                }

                return { code: 200, data: result.data }

            } catch (e) {
                state.error = String(e)
                return {
                    code: 500,
                    data: null,
                }
            } finally {
                state.loading = false
            }
        })()
    }

}
