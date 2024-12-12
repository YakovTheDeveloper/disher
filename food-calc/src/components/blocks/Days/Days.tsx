import Actions from '@/components/blocks/common/Actions/Actions'
import AddDishToDay from '@/components/blocks/Days/AddDishToDay/AddDishToDay'
import Day from '@/components/blocks/Days/Day'
import NutrientPercent from '@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent'
import NutrientsList from '@/components/blocks/NutrientsTotal/NutrientsList/NutrientsList'
import NutrientsTotal from '@/components/blocks/NutrientsTotal/NutrientsTotal'
import NutrientValue from '@/components/blocks/NutrientsTotal/NutrientValue/NutrientValue'
import Layout from '@/components/common/Layout/Layout'
import Button from '@/components/ui/Button/Button'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import { Typography } from '@/components/ui/Typography/Typography'
import { DayCalculationContext } from '@/context/calculationContext'
import { currentCalculationStore, dayCalculationStore, rootDailyNormStore, rootDayStore2 } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { NavLink } from 'react-router'

const Days = () => {
    const {
        currentStore,
        allStores,
        setCurrentDayId,
        currentDayId,
        isDraftId,
        removeDay,
        loadingState
    } = rootDayStore2



    return (
        <Layout
            left={
                <div>
                    <NavLink
                        to='/calendar'
                    >
                        <Typography color='green'>Календарь</Typography>
                    </NavLink>
                    <TabList isLoading={loadingState.getLoading('all')}>
                        {allStores.map(({ id, name }, i) => (
                            <Tab
                                key={id}
                                draft={i === 0}
                                onClick={() => setCurrentDayId(id)}
                                isActive={currentDayId === id}
                                after={i === 0 ? null : <RemoveButton onClick={() => removeDay(id)} size='small' />}
                            >

                                {name}
                            </Tab>))}
                    </TabList>
                </div>
            }
            center={
                currentStore && (
                    <Day
                        store={currentStore}
                        actions={
                            <Actions store={currentStore} variant='day' loadingState={loadingState} />
                        }
                    >
                        {currentStore.currentCategory &&
                            <DayCalculationContext.Provider value={{
                                updateCalculations: currentCalculationStore.updateDayCalculationsWithCurrentProducts
                            }}>
                                <AddDishToDay currentCategory={currentStore.currentCategory} />
                            </DayCalculationContext.Provider>
                        }
                    </Day>
                )

            }
            right={
                currentStore &&
                <NutrientsTotal  >
                    <NutrientsList
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
                    />
                </NutrientsTotal>
            }
        >
        </Layout>
    )
}

export default observer(Days)

