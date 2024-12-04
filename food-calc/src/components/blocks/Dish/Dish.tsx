import React from "react";
import DishItem from "./DishItem/DishItem";
import { observer } from "mobx-react-lite";
import { productStore, UIStore } from "../../../store/rootStore";
import { IMenu } from "../../../types/Menu/Menu";
import { DishStore } from "@/store/rootDishStore/dishStore/dishStore";
import s from "./Dish.module.css";
import Container from "@/components/ui/Container/Container";
import { Typography } from "@/components/ui/Typography/Typography";
import RemoveButton from "@/components/ui/RemoveButton/RemoveButton";
import { Modals } from "@/store/uiStore/uiStore";
import { IProductBase } from "@/types/dish/dish";
import Layout from "@/components/common/Layout/Layout";

type Props = {
  menu: IMenu;
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
    empty,
  } = store;
  const { getLoadingStatus } = productStore;

  const onClickProductName = (product: IProductBase) => {
    UIStore.openModal(Modals.Product, { Product: product });
  };

  return (
    <section className={s.dish}>

      <Typography align="center" variant="h1">
        {name}
      </Typography>
      <div>
        {/* <h4>Продукты</h4> */}
        {empty && (
          <>
            <Typography variant="caption">Список пуст</Typography>
            <p>Можно добавить продукты, воспользовавшись поиском</p>
          </>
        )}
        <div className={s.products}>
          {products.map((product) => (
            <DishItem
              key={product.id}
              product={product}
              setProductQuantity={setProductQuantity}
              isLoading={getLoadingStatus(product.id)}
              onNameClick={() => onClickProductName(product)}
              after={
                <RemoveButton
                  onClick={() => removeProduct(product.id)}
                  className={s.removeButton}
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
