import Dish from "@/components/blocks/Menu/Dish"
import Button from "@/components/ui/Button/Button"
import { DishStore, DraftDishStore, UserDishStore } from "@/store/rootDishStore/dishStore/dishStore"
import { observer } from "mobx-react-lite"
import s from './Dish.module.css'
import Actions, { DraftActions, UserActions } from "@/components/blocks/common/Actions/Actions"

type Props = {
    store: UserDishStore | DraftDishStore
    removeDish: any
}

function DishContainer(props: Props) {
    const { store } = props

    return (
        <Dish store={store}>
            <Actions store={store} />
        </Dish>
    )
}

function IfContentChange({ changeOccured, children }) {
    if (!changeOccured) return null
    return children
}

export default observer(DishContainer)