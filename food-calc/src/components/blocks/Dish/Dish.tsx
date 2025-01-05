import React from "react";
import { observer } from "mobx-react-lite";
import { uiStore } from "../../../store/rootStore";
import { DishStore, DraftDishStore } from "@/store/rootDishStore/dishStore/dishStore";
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
import Input from "@/components/ui/Input/Input";

type Props = {
  store: DishStore;
  children: React.ReactNode;
};

function Dish(props: Props) {
  const { store, children } = props;
  const {
    products = [],
    productsV2 = [],
    setProductQuantity,
    removeProduct,
    name,
    updateName,
    id,
    empty,
  } = store;

  const onClickProductName = (product: IProductBase) => {
    uiStore.modal.openModal(Modals.Product, product);
  };

  const isDraft = store instanceof DraftDishStore

  const dishTitleText = isDraft ? 'Создание нового блюда' : 'Редактирование вашего блюда'

  return (
    <section className={s.dish}>
      {/* <div className={s.dishTitle}>
        <Typography variant="caption" offset align="left" >{dishTitleText}</Typography>
      </div> */}
      <SearchProduct />


      <div className={s.dishMain}>
        <EmptyListMessage isShow={empty} />
        <div className={s.products} key={id}>
          {productsV2.map((product) => (
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
      <header className={s.dishHeader}>
        {isDraft
          ? <Input
            placeholder="Рис с овощами..."
            typographyVariant="h2"
            wrapperClassName={s.dishNameInput}
            value={name}
            onChange={(e) => updateName(e.target.value)}
            label={<Typography variant="caption" align="center">Название для вашего блюда</Typography>}
          />
          : <EditableText
            key={id}
            placeholder="Рис с овощами..."
            typographyProps={{
              variant: 'h2',
              underline: true,
              color: 'green-2'
            }}
            value={name}
            onChange={updateName}
          />
        }
      </header>
      {children}
    </section>
  );
}

export default observer(Dish);
