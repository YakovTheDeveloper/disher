import React, { useEffect, useState } from 'react'
import { observer } from "mobx-react-lite"
import { rootMenuStore } from '../../../store/rootStore'
import { GetProducts } from 'types/api/product'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import { IProductBase } from '@/types/menu/Menu'
import { DraftMenuStore } from '@/store/rootMenuStore/menuStore/menuStore'
import { DRAFT_DISH_ID } from '@/store/rootMenuStore/rootMenuStore'

function DishChoose() {
    const { dishes, setCurrentMenuId, currentMenuId, currentMenu, addDish } = rootMenuStore

    const showAddButton = currentMenu.collectionType === 'menu'

    const onDishAdd = (id: number, products: IProductBase[], name: string) => {
        addDish(id, name)
    }

    return (
        <nav>
            <TabList>
                {dishes.map(({ id, name, collectionType, products }) =>
                (
                    <div>
                        {showAddButton && id !== DRAFT_DISH_ID && <button onClick={() => onDishAdd(+id, products, name)}>+</button>}
                        <Tab
                            key={id}
                            onClick={() => setCurrentMenuId(id)}
                            isActive={currentMenuId === id}>
                            {name} ({collectionType})
                        </Tab>
                    </div>
                ))}
            </TabList>
            {/* <button onClick={onAdd}>+</button> */}
        </nav>
    )
}

export default observer(DishChoose)