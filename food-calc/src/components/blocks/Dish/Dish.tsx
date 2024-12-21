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
import EditableText from "@/components/ui/EditableText/EditableText";
import EmptyListMessage from "@/components/blocks/Dish/EmptyListMessage/EmptyListMessage";
import SearchProduct from "@/components/blocks/SearchProduct/SearchProduct";
import Button from "@/components/ui/Button/Button";

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
    updateName,
    id,
    empty,
    convertAllProductsTo100Gr
  } = store;

  const onClickProductName = (product: IProductBase) => {
    uiStore.modal.openModal(Modals.Product, product);
  };

  return (
    <section className={s.dish}>
      <SearchProduct />
      <header className={s.dishHeader}>
        <EditableText
          key={id}
          typographyProps={{
            variant: 'h1'
          }}
          value={name}
          onChange={updateName}
        />
        <Button variant='secondary' onClick={() => convertAllProductsTo100Gr()}>
          <p>перевести</p>
          в 100 гр.
        </Button>
      </header>
      <div className={s.dishMain}>
        <EmptyListMessage isShow={empty} />
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
                  size="small"
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
