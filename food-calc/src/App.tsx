import { useEffect, useState } from 'react'
import './App.css'
// import Menu from './components/blocks/Menu/Menu'
import { rootMenuStore, productStore } from './store/rootStore'
import { observer } from "mobx-react-lite"
import MenuChoose from './components/blocks/MenuChoose/MenuChoose'
import SearchProduct from './components/blocks/SearchProduct/SearchProduct'
import NutrientsTotal from './components/blocks/NutrientsTotal/NutrientsTotal'

import { fetchGetProducts } from './api/product'
import Menu from '@/components/blocks/Menu/Menu'
import ModalAuth from '@/components/ui/Modal/ModalAuth'
import ModalRoot from '@/ModalRoot'
import DishChoose from '@/components/blocks/DishChoose/DishChoose'


const useInit = () => {

  useEffect(() => {
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
        <DishChoose />
        <MenuChoose />

        {rootMenuStore.currentMenu && <Menu />}

        <NutrientsTotal />

      </div>
    </>
  )
}

export default observer(App)
