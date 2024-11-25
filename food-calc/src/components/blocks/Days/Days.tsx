import Day from '@/components/blocks/Days/Day'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import { rootDayStore } from '@/store/rootStore'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'

const Days = () => {

    const { createDay, updateDay, allStores, setCurrentDayId, currentDayId, removeDay, isDraftId } = rootDayStore

    const currentStore = allStores.find(({ id }) => id === currentDayId)

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
        </section>
    )
}

export default observer(Days)