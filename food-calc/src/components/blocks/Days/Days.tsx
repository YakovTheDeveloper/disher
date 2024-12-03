import Day from '@/components/blocks/Days/Day'
import NutrientPercent from '@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent'
import NutrientsTotal from '@/components/blocks/NutrientsTotal/NutrientsTotal'
import NutrientValue from '@/components/blocks/NutrientsTotal/NutrientValue/NutrientValue'
import Layout from '@/components/common/Layout/Layout'
import Container from '@/components/ui/Container/Container'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import { DRAFT_ID } from '@/store/rootDayStore/rootDayStore'
import { getFullDataStore, rootDayStore } from '@/store/rootStore'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'

const Days = () => {

    const { addDay, updateDay, allStores, setCurrentDayId, currentDayId, removeDay, isDraftId, calculations } = rootDayStore

    const currentStore = allStores.find(({ id }) => id === currentDayId)

    const isLoading = getFullDataStore.isProductNutrientsLoading.day[currentDayId]



    return (
        <Layout
            left={
                <TabList >
                    {allStores.map(({ id, name }, i) => (
                        <Tab
                            key={id}
                            draft={i === 0}
                            onClick={() => setCurrentDayId(id)}
                            isActive={currentDayId === id}
                            after={isDraftId(id) ? null : <RemoveButton onClick={() => removeDay(id)} size='small' />}
                        >

                            {name}
                        </Tab>))}
                </TabList>
            }
            center={
                currentStore && <Day store={currentStore} ></Day>
            }
            right={
                currentStore &&
                <NutrientsTotal

                    rowPositionSecond={(nutrient) => (
                        <NutrientValue
                            nutrient={nutrient}
                            calculations={calculations}

                        />
                    )}
                    rowPositionThird={({ id }) => (
                        <NutrientPercent
                            nutrientId={id}
                            nutrientQuantity={calculations.totalNutrients[id]}
                        />
                    )}
                    loading={isLoading}></NutrientsTotal>
            }
        >
        </Layout>
    )
}

export default observer(Days)





/*
    I have nutrition calculation app.
    I get list of dishes (day) with products (product don't have nutrition data, we should load it separately)
    I need to recalculate total nutritions every time:
    1) New dish appears in day
    2) We change tab to navigate to another day (list of dishes)
    3) When we delete dish from day
    Also, nutrition table should not show result until we get ALL day products nutrition data.
    Help me create architecture to solve this problem efficiently, best practice and simple
*/