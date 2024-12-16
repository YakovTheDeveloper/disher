import { useEffect } from "react";
// import Menu from './components/blocks/Menu/Menu'
import {
  rootDishStore,
  productStore,
  dishCalculationStore,
} from "../../../store/rootStore";
import { observer } from "mobx-react-lite";
import SearchProduct from "../SearchProduct/SearchProduct";

import { fetchGetProducts } from "../../../api/product";
import { toJS } from "mobx";
import Dishes from "@/components/blocks/Dish/Dishes";
import s from './CreateDish.module.css'
const useInit = () => {
  useEffect(() => {
    fetchGetProducts().then((res) => {
      if (res.isError) return
      productStore.setProductsBase(res.data)
    });
  }, []);
};

function CreateDish() {
  useInit();

  const { currentDish } = rootDishStore

  return (
    <div className={s.createDish}>
      <Dishes store={currentDish} >
        <SearchProduct />
      </Dishes>
    </div>
  );
}

export default observer(CreateDish);
