import React from "react";
import { observer } from "mobx-react-lite";
import { uiStore } from "../../../store/rootStore";
import { DishStore } from "@/store/rootDishStore/dishStore/dishStore";
import s from "./Dish.module.css";
import { Typography } from "@/components/ui/Typography/Typography";
import RemoveButton from "@/components/ui/RemoveButton/RemoveButton";

import { IProductBase } from "@/types/dish/dish";
import DishProduct from "./DishItem/DishProduct";
import { toJS } from "mobx";
import { Modals } from "@/store/uiStore/modalStore/modalStore";

type Props = {
  store: DishStore;
  children: React.ReactNode;
};

function Dish(props: Props) {
  const { store, children } = props;
  const {
    products = [],
    setProductQuantity,
    removeProduct,
    name,
    id,
    empty,
  } = store;

  const onClickProductName = (product: IProductBase) => {
    uiStore.modal.openModal(Modals.Product, product);
  };


  console.log(toJS(products))

  return (
    <section className={s.dish}>
      <Typography align="center" variant="h1">
        {name}
      </Typography>
      <div>
        {empty && (
          <>
            <Typography variant="caption">Список пуст</Typography>
            <p>Можно добавить продукты, воспользовавшись поиском</p>
          </>
        )}
        <div className={s.products} key={id}>
          {products.map((product) => (
            <DishProduct
              key={product.id}
              product={product}
              setProductQuantity={setProductQuantity}
              onNameClick={() => onClickProductName(product)}
              after={
                <RemoveButton
                  onClick={() => removeProduct(product.id)}
                  className={s.removeButton}
                  color="gray"
                />
              }
            />
          ))}
        </div>
      </div>
      {children}
    </section>
  );
}

export default observer(Dish);
