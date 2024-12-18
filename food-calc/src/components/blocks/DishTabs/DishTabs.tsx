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

function DishTabs() {
    const { draftDish, userDishes, setCurrentDishId, currentDishId, loadingState } = rootDishStore

    const isLoading = loadingState.getLoading('all')

    return (
        <nav className={s.dishTabs}>
            <TabList isLoading={isLoading}>
                <Tab
                    draft
                    onClick={() => setCurrentDishId(draftDish.id)}
                    isActive={currentDishId === draftDish.id}

                >
                    Новое блюдо
                </Tab>
                {userDishes.map(({ id, name }) => (
                    <Tab
                        key={id}
                        onClick={() => setCurrentDishId(id)}
                        isActive={currentDishId === id}
                        after={

                            <Tooltip>
                                <RemoveTooltip
                                    onConfirm={() => Flows.Dish.remove(id, name)}
                                >
                                    <RemoveButton size='small' color='gray' />
                                </RemoveTooltip>
                            </Tooltip>


                        }
                    >
                        {name}
                    </Tab>))
                }
            </TabList>
        </nav>
    )
}

export default observer(DishTabs)