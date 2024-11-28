import Dish from "@/components/blocks/Menu/Dish"
import Button from "@/components/ui/Button/Button"
import { DishStore, DraftDishStore, UserDishStore } from "@/store/rootDishStore/dishStore/dishStore"
import { observer } from "mobx-react-lite"
import s from './Dish.module.css'

type Props = {
    store: DishStore
    removeDish: any
}

function DishContainer(props: Props) {


    const { store } = props
    const { resetToInit, save } = store


    if (store instanceof DraftDishStore) {
        const { productsEmpty } = store
        return (
            <Dish store={store}>
                <Button onClick={save} >Сохранить</Button>
                {!productsEmpty &&
                    <Button onClick={resetToInit} variant="danger">
                        Очистить все продукты
                    </Button>}
            </Dish>
        )
    }

    if (store instanceof UserDishStore) {
        const { id, changeOccured, removeDish } = store
        return (
            <Dish store={store}>
                <IfContentChange changeOccured={changeOccured}>
                    <Button className={s.mainButton} onClick={() => save(id)} >
                        Обновить
                    </Button>
                </IfContentChange>
                <IfContentChange changeOccured={changeOccured}>
                    <Button onClick={resetToInit} variant="danger">
                        Сбросить к первоначальному
                    </Button>
                </IfContentChange>
                <Button onClick={() => removeDish(id)} variant="danger">Удалить</Button>
            </Dish>

        )
    }
}


function IfContentChange({ changeOccured, children }) {
    if (!changeOccured) return null
    return children
}

export default observer(DishContainer)