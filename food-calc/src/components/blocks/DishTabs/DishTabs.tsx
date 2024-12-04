import React, { useEffect, useState } from 'react'
import { observer } from "mobx-react-lite"
import { rootDishStore } from '../../../store/rootStore'
import { GetProducts } from 'types/api/product'
import { Tab } from '@/components/ui/Tab'
import { TabList } from '@/components/ui/TabList'
import s from './DishTabs.module.css'
function DishTabs() {
    const { dishes, setCurrentDishId, currentDishId } = rootDishStore
    console.log(dishes)
    return (
        <nav className={s.dishTabs}>
            <TabList>
                {dishes.map(({ id, name }, i) => (<Tab draft={i === 0} key={id} onClick={() => setCurrentDishId(id)} isActive={currentDishId === id}>{name}</Tab>))}
            </TabList>
            {/* <button onClick={onAdd}>+</button> */}
        </nav>
    )
}

export default observer(DishTabs)