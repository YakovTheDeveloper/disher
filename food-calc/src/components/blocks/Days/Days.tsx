import Day from '@/components/blocks/Days/Day'
import NutrientsTotal from '@/components/blocks/NutrientsTotal/NutrientsTotal'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import { getFullDataStore, rootDayStore } from '@/store/rootStore'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'

const Days = () => {

    const { createDay, updateDay, allStores, setCurrentDayId, currentDayId, removeDay, isDraftId } = rootDayStore

    const currentStore = allStores.find(({ id }) => id === currentDayId)

    const isLoading = getFullDataStore.isProductNutrientsLoading.day[currentDayId]



    return (
        <section>
            <TabList>
                {allStores.map(({ id, name }) => (
                    <Tab
                        key={id}
                        onClick={() => setCurrentDayId(id)}
                        isActive={currentDayId === id}
                        after={isDraftId(id) ? null : <RemoveButton onClick={() => removeDay(id)} />}
                    >

                        {name}</Tab>))}
            </TabList>
            {currentStore && <Day store={currentStore} ></Day>}
            {currentStore && <NutrientsTotal totalNutrients={rootDayStore.calculations.totalNutrients} loading={isLoading}></NutrientsTotal>}
        </section>
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