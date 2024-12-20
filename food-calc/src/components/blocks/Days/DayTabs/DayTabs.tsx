import RemoveTooltip from '@/components/blocks/common/RemoveTooltip/RemoveTooltip'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import { Tooltip } from '@/components/ui/Tooltip/Tooltip'
import { RootDayStore2 } from '@/store/rootDayStore/rootDayStore2'
import { Flows } from '@/store/rootStore'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import React from 'react'

type Props = {
    day: RootDayStore2
}

const DayTabs = ({ day }: Props) => {
    const {
        userDayStores,
        setCurrentDayId,
        currentDayId,
        draftDayStore,
        removeDay,
        loadingState,
    } = day

    return (
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
                                onConfirm={() => Flows.Day.remove(id, name)}
                            >
                                <RemoveButton
                                    // className={clsx(s.removeButton)}
                                    color='gray'
                                    size='small'
                                />
                            </RemoveTooltip>
                        </Tooltip>
                    }
                >
                    {name}
                </Tab>))}
        </TabList>
    )
}

export default observer(DayTabs)