import React, { useEffect } from "react";
import { IMenu, IProductBase } from "../../../types/menu/Menu";
import { IProduct } from "../../../types/product/product";
import { observer } from "mobx-react";
import { rootDishStore } from "../../../store/rootStore";
import { toJS } from "mobx";
import { CalculationStore } from "@/store/calculationStore/calculationStore";
import { nutrientDailyNorms, nutrientsMap } from "@/store/nutrientStore/data";
import Container from "@/components/ui/Container/Container";
import { li } from "framer-motion/client";
import { IdToQuantity } from "@/types/common/common";
import s from "./NutrientsTotal.module.css";
import NutrientPercent from "@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent";
import { Typography } from "@/components/ui/Typography/Typography";
// const calc = (products: IProductBase[]) => {

//     const total: Record<string, number> = {}

//     for (const { id, quantity } of products) {
//         if (!(id in total)) {
//             total[id] = quantity
//             continue
//         }
//         total[id] = total[id] += quantity
//     }

//     return total
// }
type Category = {
  id: number;
  name: string;
  displayName: string;
  nameRu: string;
  unit: string;
};
const nutrientCategories = Object.values(nutrientsMap) as Category[];

type Props = {
  loading: boolean;
  rowPositionSecond?: React.ReactNode | ((cat: Category) => JSX.Element);
  rowPositionThird?: React.ReactNode | ((cat: Category) => JSX.Element);
};
const NutrientsTotal = ({
  loading,
  rowPositionSecond,
  rowPositionThird,
}: Props) => {
  return (
    <Container>
      <div>{loading && <span>Loading...</span>}</div>
      <ul>
        {nutrientCategories.map((category) => (
          <li className={s.nutrient}>
            <span>{category.displayName}</span>
            <span>
              {rowPositionSecond instanceof Function
                ? rowPositionSecond(category)
                : rowPositionSecond}
              {/* {totalNutrients[id] || '-'} */}{" "}
              <Typography variant="caption">{category.unit}</Typography>
            </span>
            {rowPositionThird instanceof Function
              ? rowPositionThird(category)
              : rowPositionThird}
          </li>
        ))}
      </ul>
    </Container>
  );
};

export default observer(NutrientsTotal);
