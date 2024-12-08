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
  const [localValue, setLocalValue] = useState(quantity);

  const debouncedUpdate = useCallback(
    debounce((quantity) => {
      setProductQuantity(id, quantity);
    }, 375),
    [id]
  );

  const handleChange = (value: number) => {
    setLocalValue(value)
    debouncedUpdate(value);
  };


  const isLoading = productStore.loadingState.getLoading('getOne', id)

  return (
    <div
      className={clsx([s.dishProduct])}
    >
      {isLoading &&
        <Typography className={clsx([s.caption, isLoading ? s.loading : ''])} variant="caption">
          загрузка
        </Typography>
      }
      <NumberInput
        max={4}
        value={localValue}
        onChange={handleChange}
        disabled={isLoading}
      />
      <Typography variant="body1" onClick={
        () => !isLoading && onNameClick?.()
      } className={s.productName}>
        {product.name}
      </Typography>
      <span className={clsx([s.showOnContainerHover, s.after])}>
        {after}
      </span>
    </div>
  );
}

export default observer(DishProduct);
