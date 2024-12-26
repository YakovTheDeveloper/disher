import React, { useEffect, useState } from 'react'
import { observer } from "mobx-react-lite"
import { Flows, rootDishStore, uiStore } from '../../../store/rootStore'
import { GetProducts } from 'types/api/product'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import s from './DishTabs.module.css'
import RemoveTooltip from '@/components/blocks/common/RemoveTooltip/RemoveTooltip'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import { Tooltip, TooltipContent, TooltipInner, TooltipTrigger } from '@/components/ui/Tooltip/Tooltip'
import { RootDishStore } from '@/store/rootDishStore/rootDishStore'
import { RootEntityStore } from '@/store/common/types'
import { UserDishStore, DraftDishStore } from '@/store/rootDishStore/dishStore/dishStore'
import { IDish } from '@/types/dish/dish'
import DraftTab from '@/components/ui/Tab/DraftTab'

type Props = {
    rootStore: RootEntityStore<IDish, UserDishStore, DraftDishStore>
}

function DishTabs({ rootStore }: Props) {
    const { draftStore, userStores, setCurrentId, currentItemId, loadingState } = rootStore

    const isLoading = loadingState.getLoading('all')

    return (
        <nav className={s.dishTabs}>
            <TabList isLoading={isLoading}>
                <DraftTab
                    onClick={() => setCurrentId(draftStore.id)}
                    isActive={currentItemId === draftStore.id}

                >
                    Создать блюдо
                </DraftTab>
                {userStores.map(({ id, name }) => {
                    return (
                        <Tab
                            key={id}
                            onClick={() => setCurrentId(id)}
                            isActive={currentItemId === id}
                            after={

                                <Tooltip isClick>
                                    <RemoveTooltip
                                        onConfirm={() => Flows.Dish.remove(id, name)}
                                    >
                                        <RemoveButton size='small' color='gray' />
                                    </RemoveTooltip>
                                </Tooltip>


                            }
                        >
                            {name}
                        </Tab>
                    )
                })
                }
            </TabList>
        </nav>
    )
}

export default observer(DishTabs)