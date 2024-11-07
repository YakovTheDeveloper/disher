import React, { useEffect, useState } from 'react'
import { observer } from "mobx-react-lite"
import { rootMenuStore } from '../../../store/rootStore'
import { GetProducts } from 'types/api/product'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'

function MenuChoose() {
    const { menus, setCurrentMenuId, currentMenuId } = rootMenuStore
    return (
        <nav>
            <TabList>
                {menus.map(({ menu }) => (menu && <Tab key={menu.id} onClick={() => setCurrentMenuId(menu.id)} isActive={currentMenuId === menu.id}>{menu.name}</Tab>))}
            </TabList>
            {/* <button onClick={onAdd}>+</button> */}
        </nav>
    )
}

export default observer(MenuChoose)