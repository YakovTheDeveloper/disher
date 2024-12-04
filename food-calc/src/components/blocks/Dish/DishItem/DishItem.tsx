import React, { memo, useCallback, useState } from "react";
import { IProductBase } from "../../../../types/menu/Menu";
import { observer } from "mobx-react";
import { toJS } from "mobx";
import { ProductLoading } from "@/store/productStore/productStore";
import s from "./DishProduct.module.css";
import clsx from "clsx";
import { Typography } from "@/components/ui/Typography/Typography";
import NumberInput from "@/components/ui/Input/InputNumber";
import { debounce } from "@/utils/debounce";

type Props = {
  product: IProductBase;
  menuId: string;
  isLoading: ProductLoading | null;
  setProductQuantity: (productId: number, quantity: number) => void;
  after?: React.ReactNode;
  onNameClick: () => void;
};

function DishItem({
  product,
  setProductQuantity,
  isLoading,
  after,
  onNameClick,
}: Props) {

  const disabled =
    isLoading?.isLoading ||
    isLoading?.status === "error" ||
    isLoading?.status === "pending";

  const { quantity, id } = product
  const [localValue, setLocalValue] = useState(quantity);

  const debouncedUpdate = useCallback(
    debounce((quantity) => {
      setProductQuantity(id, quantity);
    }, 450),
    [id]
  );

  const handleChange = (value: number) => {
    setLocalValue(value)
    debouncedUpdate(value);
  };




  return (
    <div
      className={clsx([s.dishProduct, isLoading?.isLoading ? s.loading : ""])}
    >

      <NumberInput
        max={4}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
      />
      <Typography variant="body1" onClick={onNameClick} className={s.productName}>
        {product.name}
      </Typography>
      {after}
    </div>
  );
}

export default memo(observer(DishItem));
