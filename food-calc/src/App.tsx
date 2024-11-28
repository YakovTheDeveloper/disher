import { useEffect, useState } from 'react'
import './App.css'
// import Menu from './components/blocks/Menu/Menu'
import { rootDishStore, productStore, dishCalculationStore } from './store/rootStore'
import { observer } from "mobx-react-lite"
import MenuChoose from './components/blocks/MenuChoose/MenuChoose'
import SearchProduct from './components/blocks/SearchProduct/SearchProduct'
import NutrientsTotal from './components/blocks/NutrientsTotal/NutrientsTotal'

import { fetchGetProducts } from './api/product'
import Dish from '@/components/blocks/Menu/Dish'
import DishContainer from '@/components/blocks/Menu/DishContainer'
import Container from '@/components/ui/Container/Container'


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

        <Container>
          <MenuChoose />
          <Container boxShadow>
            {rootDishStore.currentDish && <DishContainer store={rootDishStore.currentDish} />}
          </Container>
          <NutrientsTotal totalNutrients={dishCalculationStore.totalNutrients} />
        </Container>


      </div>
    </>
  )
}

export default observer(App)
