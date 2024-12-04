import { useEffect, useState } from "react";
import "./App.css";
// import Menu from './components/blocks/Menu/Menu'
import {
  rootDishStore,
  productStore,
  dishCalculationStore,
} from "./store/rootStore";
import { observer } from "mobx-react-lite";
import MenuChoose from "./components/blocks/DishTabs/DishTabs";
import SearchProduct from "./components/blocks/SearchProduct/SearchProduct";
import NutrientsTotal from "./components/blocks/NutrientsTotal/NutrientsTotal";

import { fetchGetProducts } from "./api/product";
import Dish from "@/components/blocks/Dish/Dish";
import DishContainer from "@/components/blocks/Dish/Dishes";
import Container from "@/components/ui/Container/Container";
import NutrientPercent from "@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent";
import { toJS } from "mobx";
import Dishes from "@/components/blocks/Dish/Dishes";

const useInit = () => {
  useEffect(() => {
    fetchGetProducts().then((result) => productStore.setProductsBase(result));
  }, []);
};

function App() {
  useInit();
  console.log(
    "dishCalculationStore.totalNutrients",
    toJS(dishCalculationStore.totalNutrients)
  );
  const { currentDish } = rootDishStore
  return (
    <>
      <div>
        <SearchProduct />
        <Dishes store={currentDish} />
      </div>
    </>
  );
}

export default observer(App);
