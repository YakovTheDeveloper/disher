import React, { memo, useCallback, useState } from "react";
import { IProductBase } from "../../../../types/menu/Menu";
import { observer } from "mobx-react";
import { toJS } from "mobx";
import s from "./DishProduct.module.css";
import clsx from "clsx";
import { Typography } from "@/components/ui/Typography/Typography";
import NumberInput from "@/components/ui/Input/InputNumber";
import { debounce } from "@/utils/debounce";
import DishLoader from "@/components/blocks/Dish/DishItem/DishLoader";
import { productStore } from "@/store/rootStore";
import Overlay from "@/components/ui/Overlay/Overlay";
import QuantityControl from "@/components/ui/QuantityControl/QuantityControl";

type Props = {
  product: IProductBase;
  setProductQuantity: (productId: number, quantity: number) => void;
  after?: React.ReactNode;
  onNameClick?: () => void;
};

function DishProduct({
  product,
  setProductQuantity,
  after,
  onNameClick,
}: Props) {

  const { quantity, id } = product

  const debouncedUpdate = useCallback(
    debounce((quantity) => {
      setProductQuantity(id, quantity);
    }, 375),
    [id]
  );

  const handleChange = (value: number) => {
    debouncedUpdate(value);
  };




  const isLoading = productStore.loadingState.getLoading('getOne', id)

  return (
    <div
      className={clsx([s.dishProduct, isLoading && s.loading])}
    >
      <Overlay show={isLoading} />
      <div className={s.productNameContainer}>
        <Typography
          variant="body1"
          clickable
          onClick={
            () => !isLoading && onNameClick?.()
          }
          className={clsx([
            s.productName,
            onNameClick && s.productNameClickable
          ])}
        >
          {product.nameRu}
        </Typography>
        <span className={clsx([s.showOnContainerHover, s.after])}>
          {after}
        </span>
      </div>
      <QuantityControl quantity={quantity} onChange={handleChange} />
    </div>
  );
}

export default observer(DishProduct);
