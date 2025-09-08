import { PaginationStore } from "@/store/common/PaginationStore"
import { DishStore } from "@/store/rootDishStore/dishStore/dishStore"
import { DishUiStore } from "@/store/uiStore/dishUiStore/dishUiStore"
import { DishFlow } from "@/store/useCasesStore/dishFlow"


type UseDishLoadingProps = {
    dishFlow: DishFlow
    dishUiStore: DishUiStore
}

export const useDishLoading = ({ dishFlow, dishUiStore }: UseDishLoadingProps) => {
    const onReachEnd = async () => dishFlow.getAll(dishUiStore.searchBarDishPage)

    return {
        onReachEnd
    }

}

type UseDishSearchProps = {
    dishUiStore: DishUiStore
    dishStores: DishStore[]
    paginationStore: PaginationStore
}


export const useDishSearch = ({ dishStores, dishUiStore, paginationStore }: UseDishSearchProps) => {
    const search = dishUiStore.searchBarDishPage

    const content =
        search
            ? dishStores.filter(({ name }) => {
                return name.toLowerCase().includes(search.toLowerCase())
            })
            : dishStores

    const disabled = dishStores.length === paginationStore.itemsCount


    return {
        content,
        disabled
    }
}