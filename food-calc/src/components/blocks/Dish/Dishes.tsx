import Dish from "@/components/blocks/Dish/Dish"
import { DraftDishStore, UserDishStore } from "@/store/rootDishStore/dishStore/dishStore"
import { observer } from "mobx-react-lite"
import Layout from "@/components/common/Layout/Layout"
import NutrientPercent from "@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent"
import NutrientsTotal from "@/components/blocks/NutrientsTotal/NutrientsTotal"
import { dishCalculationStore, Flows, rootDailyNormStore, rootDishStore } from "@/store/rootStore"
import DishTabs from "@/components/blocks/DishTabs/DishTabs"
import NutrientValue from "@/components/blocks/NutrientsTotal/NutrientValue/NutrientValue"
import DraftActions2 from "@/components/blocks/common/Actions/DraftActions2"
import UserActions2 from "@/components/blocks/common/Actions/UserActions2"
import Container from "@/components/ui/Container/Container"

type Props = {
    store: UserDishStore | DraftDishStore
    children: React.ReactNode
}


function Dishes(props: Props) {
    const { store } = props
    const { loadingState, draftDish, currentDish } = rootDishStore

    return (
        <Layout
            left={
                <DishTabs />
            }
            center={
                <Dish store={store}>
                    {currentDish instanceof UserDishStore
                        ? <UserActions2
                            store={currentDish}
                            loadingState={loadingState}
                            remove={() => Flows.Dish.remove(currentDish.id, currentDish.name)}
                            update={() => Flows.Dish.update(currentDish.id, currentDish.name)}
                            resetToInit={currentDish.resetToInit}
                        />
                        : <DraftActions2
                            loadingState={loadingState}
                            isEmpty={draftDish.empty}
                            resetToInit={draftDish.resetToInit}
                            save={() => Flows.Dish.create()}
                        />
                    }

                </Dish>

            }
            right={
                <NutrientsTotal
                    rowPositionSecond={(nutrient) => (
                        <NutrientValue
                            nutrient={nutrient}
                            calculations={dishCalculationStore}
                        />
                    )}
                    rowPositionThird={(nutrient) => (
                        <NutrientPercent
                            dailyNutrientNorm={rootDailyNormStore.currentDailyNormUsedInCalculations}
                            nutrient={nutrient}
                            nutrientQuantity={dishCalculationStore.totalNutrients[nutrient.id]}
                            showFindRichProduct
                        />

                    )}
                >
                </NutrientsTotal>
            }
            overlayCenter={
                (store instanceof DraftDishStore && loadingState.getLoading('save'))
                || loadingState.getLoading('update', store.id)
                || loadingState.getLoading('delete', store.id)
            }
        />

    )
}

export default observer(Dishes)