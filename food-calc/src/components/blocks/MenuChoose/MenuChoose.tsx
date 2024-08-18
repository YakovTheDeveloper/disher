import React, { useEffect, useState } from 'react'
import { observer } from "mobx-react-lite"
import { Menus } from '../../../store/rootStore'
import { Tabs, TabList, Tab, TabIndicator, TabPanels, TabPanel } from '@chakra-ui/react'
import { GetProducts } from 'types/api/product'

function MenuChoose() {
    const [tabIndex, setTabIndex] = useState(0)

    const { menus ,setCurrentMenuId} = Menus



    const onAdd = () => {
        const newMenu = Menus.create()
        setCurrentMenuId(newMenu.id)
    }

    const handleTabsChange = (index: number) => {
        setTabIndex(index)
    }

    useEffect(() => {
        const currentIdx = Menus.menus.findIndex(menu => menu.id === Menus.currentMenuId)
        setTabIndex(currentIdx)
    }, [Menus.currentMenuId])

    return (
        <nav>
            <Tabs defaultIndex={0} position='relative' variant='unstyled' index={tabIndex} onChange={handleTabsChange}>
                <TabList>
                    {menus.map(({ name, id }) => (<Tab key={id} onClick={() => setCurrentMenuId(id)}>{name}</Tab>))}
                    <button onClick={onAdd}>+</button>
                </TabList>
                <TabIndicator mt='-1.5px' height='2px' bg='blue.500' borderRadius='1px' />
            </Tabs>
        </nav>
    )
}

export default observer(MenuChoose)