import { useEffect, useState } from 'react'
import './App.css'
import Menu from './components/blocks/Menu/Menu'
import { Menus } from './store/rootStore'
import { observer } from "mobx-react-lite"
import MenuChoose from './components/blocks/MenuChoose/MenuChoose'
import SearchProduct from './components/blocks/SearchProduct/SearchProduct'
import NutrientsTotal from './components/blocks/NutrientsTotal/NutrientsTotal'




function App() {

  useEffect(() => {
    const newMenu = Menus.create()
    Menus.setCurrentMenuId(newMenu.id)
  }, [])

  




  return (
    <>

      <div>

        <SearchProduct />

        <MenuChoose />

        <Menu menu={Menus.currentMenu} />

        <NutrientsTotal/>

      </div>
    </>
  )
}

export default observer(App)
