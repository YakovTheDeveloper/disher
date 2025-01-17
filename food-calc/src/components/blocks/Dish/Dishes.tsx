import Dish from "@/components/blocks/Dish/Dish"
import { DraftDishStore, UserDishStore } from "@/store/rootDishStore/dishStore/dishStore"
import { observer } from "mobx-react-lite"
import Layout from "@/components/common/Layout/Layout"
import NutrientPercent from "@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent"
import NutrientsTotal from "@/components/blocks/NutrientsTotal/NutrientsTotal"
import { dishCalculationStore, Flows, rootDailyNormStore, rootDishStore, uiStore } from "@/store/rootStore"
import DishTabs from "@/components/blocks/DishTabs/DishTabs"
import NutrientValue from "@/components/blocks/NutrientsTotal/NutrientValue/NutrientValue"
import DraftActions2 from "@/components/blocks/common/Actions/DraftActions2"
import UserActions2 from "@/components/blocks/common/Actions/UserActions2"
import Container from "@/components/ui/Container/Container"
import { RootEntityStore } from "@/store/common/types"
import { IDish } from "@/types/dish/dish"
import { useEffect } from "react"
import SearchProduct from "@/components/blocks/SearchProduct/SearchProduct"
import { isEmpty } from "@/lib/empty"
import RightPanel from "@/components/common/Layout/RightPanel/RightPanel"
import DishFormAdditionals from "@/components/blocks/Dish/DishFormAdditionals/DishFormAdditionals"
import DishDivideSettings from "@/components/blocks/Dish/DishDivideSettings/DishDivideSettings"

type Props = {
    rootStore: RootEntityStore<IDish, UserDishStore, DraftDishStore>
}


function Dishes({ rootStore = rootDishStore }: Props) {
    const { loadingState, draftStore, currentStore } = rootStore

    if (!currentStore) return null

    return (
        <Layout
            left={
                <DishTabs rootStore={rootStore} />
            }
            center={
                <Dish store={currentStore}>
                    {currentStore instanceof UserDishStore
                        ? <UserActions2
                            store={currentStore}
                            loadingState={loadingState}
                            remove={() => Flows.Dish.remove(currentStore.id, currentStore.name)}
                            update={() => Flows.Dish.update(currentStore.id, currentStore.name)}
                            resetToInit={currentStore.resetToInit}
                        />
                        : <DraftActions2
                            loadingState={loadingState}
                            isEmpty={draftStore.empty}
                            resetToInit={draftStore.resetToInit}
                            save={() => Flows.Dish.create()}
                        />
                    }

                </Dish>

            }
            right={
                <RightPanel
                    topElement={uiStore.dishUi.additionalDishFormDataShow && (
                        <div>
                            <DishFormAdditionals rootDishStore={rootDishStore} />
                            <DishDivideSettings dishStore={currentStore} />
                        </div>
                    )}
                    onBack={() => uiStore.dishUi.setAdditionalDishFormDataShow(false)}
                >
                    {isEmpty(currentStore.productsV2)
                        ? null
                        : <NutrientsTotal
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
                                // showFindRichProduct
                                />

                            )}
                        >
                        </NutrientsTotal>}
                </RightPanel>
            }
            overlayCenter={
                (currentStore instanceof DraftDishStore && loadingState.getLoading('save'))
                || loadingState.getLoading('update', currentStore.id)
                || loadingState.getLoading('delete', currentStore.id)
            }
        />

    )
}

export default observer(Dishes)