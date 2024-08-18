import { useEffect, useState } from 'react'
import './App.css'
// import Menu from './components/blocks/Menu/Menu'
import { Menus, productStore } from './store/rootStore'
import { observer } from "mobx-react-lite"
import MenuChoose from './components/blocks/MenuChoose/MenuChoose'
import SearchProduct from './components/blocks/SearchProduct/SearchProduct'
import NutrientsTotal from './components/blocks/NutrientsTotal/NutrientsTotal'

import { fetchGetProducts } from './api/product'
import Menu from '@/components/blocks/Menu/Menu'


const useInit = () => {

  useEffect(() => {
    const newMenu = Menus.create()
    Menus.setCurrentMenuId(newMenu.id)

    fetchGetProducts().then(result =>
      productStore.setProductsBase(result)
    )
  }, [])


}

function App() {

  useInit()




  return (
    <>

      <div>

        <SearchProduct />

        <MenuChoose />

        {Menus.currentMenu && <Menu menu={Menus.currentMenu} />}

        <NutrientsTotal />

      </div>
    </>
  )
}

export default observer(App)
