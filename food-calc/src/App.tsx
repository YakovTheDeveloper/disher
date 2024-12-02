import { useEffect, useState } from "react";
import "./App.css";
// import Menu from './components/blocks/Menu/Menu'
import {
  rootDishStore,
  productStore,
  dishCalculationStore,
} from "./store/rootStore";
import { observer } from "mobx-react-lite";
import MenuChoose from "./components/blocks/MenuChoose/MenuChoose";
import SearchProduct from "./components/blocks/SearchProduct/SearchProduct";
import NutrientsTotal from "./components/blocks/NutrientsTotal/NutrientsTotal";

import { fetchGetProducts } from "./api/product";
import Dish from "@/components/blocks/Menu/Dish";
import DishContainer from "@/components/blocks/Menu/DishContainer";
import Container from "@/components/ui/Container/Container";
import NutrientPercent from "@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent";
import { toJS } from "mobx";

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
  return (
    <>
      <div>
        <SearchProduct />

        <Container>
          <MenuChoose />
          <Container boxShadow>
            {rootDishStore.currentDish && (
              <DishContainer store={rootDishStore.currentDish} />
            )}
          </Container>
          <NutrientsTotal
            rowPositionSecond={({ id }) => (
              <span>{dishCalculationStore.totalNutrients[id]}</span>
            )}
            rowPositionThird={({ id }) => (
              <NutrientPercent
                nutrientId={id}
                nutrientQuantity={dishCalculationStore.totalNutrients[id]}
              />
            )}
          />
          {/* <NutrientsTotal totalNutrients={dishCalculationStore.totalNutrients} /> */}
        </Container>
      </div>
    </>
  );
}

export default observer(App);
