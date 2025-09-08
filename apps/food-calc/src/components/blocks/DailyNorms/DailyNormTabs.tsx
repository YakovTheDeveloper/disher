import RemoveTooltip from '@/components/blocks/common/RemoveTooltip/RemoveTooltip'
import SelectableInput from '@/components/ui/Button/SelectableInput/SelectableInput'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import { Tooltip } from '@/components/ui/Tooltip/Tooltip'
import { RootDailyNormStore } from '@/store/dailyNormStore/dailyNormStore'
import { remove } from 'mobx'
import { observer } from 'mobx-react-lite'
import React from 'react'


type Props = {
    store: RootDailyNormStore
    onRemove: (id: number) => Promise<void>
}

const DailyNormTabs = ({ store, onRemove }: Props) => {

    const {
        userStores,
        defaultNorms,
        loadingState,
        draftStore,
        dailyNormIdCurrentlyInUse,
        currentItemId,
        setCurrentDailyNormInUseId,
        setCurrentId,
    } = store

    const isLoading = loadingState.getLoading('all')

    return (
        <TabList isLoading={isLoading}>
            <Tab
                draft
                isActive={currentItemId === draftStore.id}
                onClick={() => setCurrentId(draftStore.id)}
            >
                Новая норма
            </Tab>
            {defaultNorms.map(({ id, name }) => (
                <Tab
                    label={''}
                    isActive={currentItemId === id}
                    onClick={() => setCurrentId(id)}
                    before={
                        <SelectableInput
                            type="radio"
                            id={id}
                            name={name}
                            isChecked={id === dailyNormIdCurrentlyInUse}
                            onChange={setCurrentDailyNormInUseId}
                        />
                    }
                >
                    {name}
                </Tab>
            ))}
            {userStores.map(({ id, name }) => (
                <Tab
                    before={
                        <SelectableInput
                            type="radio"
                            id={id}
                            name={name}
                            isChecked={id === dailyNormIdCurrentlyInUse}
                            onChange={setCurrentDailyNormInUseId}
                        />
                    }
                    key={id}
                    onClick={() => setCurrentId(id)}
                    isActive={currentItemId === id}
                    after={
                        <Tooltip placement='left-start'>
                            <RemoveTooltip
                                onConfirm={() => onRemove(id)}
                            >
                                <RemoveButton size='small' color='gray' />

                            </RemoveTooltip>
                        </Tooltip>
                    }
                >
                    {name}
                </Tab>
            ))}
        </TabList>
    )
}

export default observer(DailyNormTabs)