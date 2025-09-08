import React, { useEffect, useRef, useState } from 'react'
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
import { useInfiniteScroll } from '@/hooks/useInfiniteScrollOptions'
import { DishFlow } from '@/store/useCasesStore/dishFlow'
import SearchInput from '@/components/ui/Input/SearchInput/SearchInput'
import { UiStore } from '@/store/uiStore/uiStore'
import DishSearch from '@/components/blocks/Dish/DishSearch/DishSearch'
import Button from '@/components/ui/Button/Button'
import { useDishLoading, useDishSearch } from '@/components/blocks/Dish/hooks'

type Props = {
    rootStore: RootDishStore
    // rootStore: RootEntityStore<IDish, UserDishStore, DraftDishStore>
    dishFlow: DishFlow
    ui: UiStore
}

function DishTabs({ rootStore, dishFlow = Flows.Dish, ui = uiStore }: Props) {

    const { dishUi } = ui

    const { draftStore, userStores, setCurrentId, currentItemId, loadingState } = rootStore

    const isLoading = loadingState.getLoading('all')

    const containerRef = useRef<HTMLDivElement>(null);

    const { onReachEnd } = useDishLoading({
        dishFlow,
        dishUiStore: ui.dishUi
    })

    const { content, disabled } = useDishSearch({
        dishStores: userStores,
        dishUiStore: dishUi,
        paginationStore: rootDishStore.pagination

    })

    const isAtEnd = useInfiniteScroll({ containerRef, onReachEnd })

    return (
        <nav className={s.dishTabs} ref={containerRef}>
            <TabList isLoading={isLoading}>
                <DraftTab
                    onClick={() => setCurrentId(draftStore.id)}
                    isActive={currentItemId === draftStore.id}

                >
                    Создать блюдо
                </DraftTab>
                <DishSearch
                    getAll={dishFlow.getAll}
                    uiStore={dishUi}
                    onChange={() => rootStore.pagination.reset()}
                />
                {content.map(({ id, name }) => {
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
            <Button onClick={onReachEnd} variant='ghost' disabled={disabled}>
                Загрузить еще
            </Button>
        </nav>
    )
}

export default observer(DishTabs)