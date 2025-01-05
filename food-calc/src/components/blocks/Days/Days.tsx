import Actions from '@/components/blocks/common/Actions/Actions'
import DraftActions2 from '@/components/blocks/common/Actions/DraftActions2'
import UserActions2 from '@/components/blocks/common/Actions/UserActions2'
import AuthNeeded from '@/components/blocks/common/AuthNeeded/AuthNeeded'
import RemoveTooltip from '@/components/blocks/common/RemoveTooltip/RemoveTooltip'
import AddDishToDay from '@/components/blocks/Days/AddDishToDay/AddDishToDay'
import Day from '@/components/blocks/Days/Day'
import DayTabs from '@/components/blocks/Days/DayTabs/DayTabs'
import NutrientPercent from '@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent'
import NutrientsList from '@/components/blocks/NutrientsTotal/NutrientsList/NutrientsList'
import NutrientsTotal from '@/components/blocks/NutrientsTotal/NutrientsTotal'
import NutrientValue from '@/components/blocks/NutrientsTotal/NutrientValue/NutrientValue'
import Layout from '@/components/common/Layout/Layout'
import Button from '@/components/ui/Button/Button'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import { Tooltip } from '@/components/ui/Tooltip/Tooltip'
import { Typography } from '@/components/ui/Typography/Typography'
import { DayCalculationContext } from '@/context/calculationContext'
import { DayStore2, UserDayStore2 } from '@/store/rootDayStore/dayStore2'
import { RootDayStore2 } from '@/store/rootDayStore/rootDayStore2'
import { currentCalculationStore, dayCalculationStore, Flows, rootDailyNormStore, rootDayStore2, userStore } from '@/store/rootStore'
import { UserStore } from '@/store/userStore/userStore'
import clsx from 'clsx'
import { s } from 'framer-motion/client'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { NavLink } from 'react-router'
type Props = {
    dayRoot: RootDayStore2
    userRoot: UserStore
}
const Days = ({ dayRoot = rootDayStore2, userRoot = userStore }: Props) => {
    const {
        currentStore,
        draftDayStore,
        loadingState,
    } = dayRoot

    if (!currentStore) return


    return (
        <Layout
            left={<DayTabs day={dayRoot} />}
            center={
                (
                    !userRoot.user
                        ? <AuthNeeded />
                        : <Day
                            store={currentStore}
                            actions={
                                <>
                                    {currentStore instanceof UserDayStore2
                                        ? <UserActions2
                                            store={currentStore}
                                            loadingState={loadingState}
                                            remove={() => Flows.Day.remove(currentStore.id, currentStore.name)}
                                            update={() => Flows.Day.update(currentStore.id, currentStore.name)}
                                            resetToInit={currentStore.resetToInit}
                                        />
                                        : <DraftActions2
                                            loadingState={loadingState}
                                            isEmpty={draftDayStore.empty}
                                            resetToInit={draftDayStore.resetToInit}
                                            save={Flows.Day.create}
                                        />
                                    }
                                </>
                                // <Actions store={currentStore} variant='day' loadingState={loadingState} />
                            }
                        >
                            {/* {currentStore.currentCategory &&
                                <DayCalculationContext.Provider value={{
                                    updateCalculations: currentCalculationStore.updateDayCalculationsWithCurrentProducts
                                }}>
                                    <AddDishToDay currentCategory={currentStore.currentCategory} />
                                </DayCalculationContext.Provider>
                            } */}
                        </Day>
                )

            }
            right={
                <NutrientsTotal
                    rowPositionSecond={(nutrient) => (
                        <NutrientValue
                            nutrient={nutrient}
                            calculations={dayCalculationStore}

                        />
                    )}
                    rowPositionThird={(nutrient) => (
                        <NutrientPercent
                            dailyNutrientNorm={rootDailyNormStore.currentDailyNormUsedInCalculations}
                            nutrientId={nutrient.id}
                            nutrient={nutrient}
                            nutrientQuantity={dayCalculationStore.totalNutrients[nutrient.id]}
                        />
                    )}
                >
                    {currentStore.currentCategory &&
                        <AddDishToDay
                            before={
                                <Button onClick={() => currentStore.setCurrentCategoryId(-1)}>
                                    {'<-'}
                                </Button>
                            }
                            currentCategory={currentStore.currentCategory}
                        />}
                </NutrientsTotal>
            }
        >
        </Layout>
    )
}

export default observer(Days)

