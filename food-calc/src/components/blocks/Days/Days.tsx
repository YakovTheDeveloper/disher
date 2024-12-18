import Actions from '@/components/blocks/common/Actions/Actions'
import DraftActions2 from '@/components/blocks/common/Actions/DraftActions2'
import UserActions2 from '@/components/blocks/common/Actions/UserActions2'
import RemoveTooltip from '@/components/blocks/common/RemoveTooltip/RemoveTooltip'
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
import { Tooltip } from '@/components/ui/Tooltip/Tooltip'
import { Typography } from '@/components/ui/Typography/Typography'
import { DayCalculationContext } from '@/context/calculationContext'
import { DayStore2, UserDayStore2 } from '@/store/rootDayStore/dayStore2'
import { currentCalculationStore, dayCalculationStore, rootDailyNormStore, rootDayStore2 } from '@/store/rootStore'
import clsx from 'clsx'
import { s } from 'framer-motion/client'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { NavLink } from 'react-router'

const Days = () => {
    const {
        currentStore,
        userDayStores,
        setCurrentDayId,
        currentDayId,
        isDraftId,
        draftDayStore,
        removeDay,
        loadingState
    } = rootDayStore2



    return (
        <Layout
            left={
                <div style={{ width: '100%' }}>
                    {/* <NavLink
                        to='/calendar'
                    >
                        <Typography color='green'>Календарь</Typography>
                    </NavLink> */}
                    <TabList isLoading={loadingState.getLoading('all')}>
                        <Tab
                            draft
                            isActive={currentDayId === draftDayStore.id}
                            onClick={() => setCurrentDayId(draftDayStore.id)}
                        >
                            Новый день
                        </Tab>
                        {userDayStores.map(({ id, name }) => (
                            <Tab
                                key={id}
                                onClick={() => setCurrentDayId(id)}
                                isActive={currentDayId === id}
                                after={

                                    <Tooltip placement='left-start'>
                                        <RemoveTooltip
                                            onConfirm={() => removeDay(id)}
                                        >
                                            <RemoveButton
                                                className={clsx(s.removeButton)}
                                                color='gray'
                                                size='small'
                                            />
                                        </RemoveTooltip>
                                    </Tooltip>
                                    // <RemoveButton onClick={() => removeDay(id)} size='small' 
                                }
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
                            <>
                                {currentStore instanceof UserDayStore2
                                    ? <UserActions2
                                        store={currentStore}
                                        loadingState={loadingState}
                                        remove={() => rootDayStore2.removeDay(currentStore.id)}
                                        update={() => rootDayStore2.updateDay(currentStore.id, currentStore.generatePayload())}
                                        resetToInit={currentStore.resetToInit}
                                    />
                                    : <DraftActions2
                                        loadingState={loadingState}
                                        isEmpty={draftDayStore.empty}
                                        resetToInit={draftDayStore.resetToInit}
                                        save={() => rootDayStore2.addDay(draftDayStore.generatePayload())}
                                    />
                                }
                            </>
                            // <Actions store={currentStore} variant='day' loadingState={loadingState} />
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
                </NutrientsTotal>
            }
        >
        </Layout>
    )
}

export default observer(Days)

