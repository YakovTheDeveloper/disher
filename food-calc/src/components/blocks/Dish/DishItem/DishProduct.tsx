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
import { productStore, rootProductStore } from "@/store/rootStore";
import Overlay from "@/components/ui/Overlay/Overlay";
import QuantityControl from "@/components/ui/QuantityControl/QuantityControl";
import { DishProduct } from "@/store/rootDishStore/dishStore/dishStore";
import ChoiceComponent from "@/components/ui/Choice/Choice";
import DishPortions from "@/components/blocks/Dish/DishItem/DishPortions/DishPortions";
import { isNotEmpty } from "@/lib/empty";

type Props = {
  product: DishProduct;
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

  const productNameClasses = clsx([
    s.productName,
    onNameClick && s.productNameClickable
  ])
  const onProductNameClick = () => !isLoading && onNameClick?.()

  const isLoading = rootProductStore.loadingState.getLoading('getOne', id)

  // console.log("product", toJS(product.portions))
  // console.log("product--", toJS(rootProductStore.userStoresMap[product.id].portions))

  const { portions, currentPortion, setCurrentPortion, setQuantity } = product

  return (
    <div
      className={clsx([s.dishProduct, isLoading && s.loading])}
    >
      <Overlay show={isLoading} />

      <QuantityControl
        quantity={quantity}
        onChange={handleChange}
        sliderClassName={s.quantitySlider}
        after={isNotEmpty(portions) && (
          <DishPortions
            portions={portions}
            currentQuantity={quantity}
            onClick={(quantity) => setQuantity(quantity)}
          />
        )}
      >
        <div className={s.productNameContainer}>
          <div>
            <Typography
              variant="body1"
              clickable
              onClick={onProductNameClick}
              className={productNameClasses}
            >
              {product.name}
            </Typography>
          </div>
          <span className={clsx([s.showOnContainerHover, s.after])}>
            {after}
          </span>
        </div>
      </QuantityControl>
    </div>
  );
}

export default observer(DishProduct);
