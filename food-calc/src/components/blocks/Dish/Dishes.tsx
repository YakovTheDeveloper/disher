import Dish from "@/components/blocks/Dish/Dish"
import Button from "@/components/ui/Button/Button"
import { DishStore, DraftDishStore, UserDishStore } from "@/store/rootDishStore/dishStore/dishStore"
import { observer } from "mobx-react-lite"
import s from './Dish.module.css'
import Actions, { DraftActions, UserActions } from "@/components/blocks/common/Actions/Actions"
import Layout from "@/components/common/Layout/Layout"
import MenuChoose from "@/components/blocks/DishTabs/DishTabs"
import NutrientPercent from "@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent"
import NutrientsTotal from "@/components/blocks/NutrientsTotal/NutrientsTotal"
import Container from "@/components/ui/Container/Container"
import { rootDishStore, dishCalculationStore } from "@/store/rootStore"
import DishTabs from "@/components/blocks/DishTabs/DishTabs"

type Props = {
    store: UserDishStore | DraftDishStore
    removeDish: any
}


function Dishes(props: Props) {
    const { store } = props

    return (

        <Layout
            left={
                <DishTabs />
            }
            center={
                <Dish store={store}>
                    <Actions store={store} />
                </Dish>
            }

            right={
                <NutrientsTotal
                    rowPositionSecond={({ id }) => (
                        <span>{dishCalculationStore.totalNutrients[id]}</span>
                    )}
                    rowPositionThird={({ id }) => (
                        <NutrientPercent
                            nutrientId={id}
                            nutrientQuantity={dishCalculationStore.totalNutrients[id]}
                        />
                    )}
                />
            }
        />

    )
}

export default observer(Dishes)