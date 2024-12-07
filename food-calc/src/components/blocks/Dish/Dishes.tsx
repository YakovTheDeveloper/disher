import Dish from "@/components/blocks/Dish/Dish"
import { DraftDishStore, UserDishStore } from "@/store/rootDishStore/dishStore/dishStore"
import { observer } from "mobx-react-lite"
import Actions from "@/components/blocks/common/Actions/Actions"
import Layout from "@/components/common/Layout/Layout"
import NutrientPercent from "@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent"
import NutrientsTotal from "@/components/blocks/NutrientsTotal/NutrientsTotal"
import { dishCalculationStore } from "@/store/rootStore"
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
                    <Actions store={store} variant="dish" />
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