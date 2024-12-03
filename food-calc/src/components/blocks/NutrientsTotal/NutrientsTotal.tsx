import React from "react";
import { observer } from "mobx-react";
import { NutrientCategory, nutrientsMap } from "@/store/nutrientStore/data";
import s from "./NutrientsTotal.module.css";
import { Typography } from "@/components/ui/Typography/Typography";

const nutrientCategories = Object.values(nutrientsMap);

type Props = {
  loading: boolean;
  rowPositionSecond?: React.ReactNode | ((cat: NutrientCategory) => JSX.Element);
  rowPositionThird?: React.ReactNode | ((cat: NutrientCategory) => JSX.Element);
};
const NutrientsTotal = ({
  loading,
  rowPositionSecond,
  rowPositionThird,
}: Props) => {
  return (
    <div>
      <div>{loading && <span>Loading...</span>}</div>
      <ul>
        {nutrientCategories.map((category) => (
          <li className={s.nutrient}>
            <span>{category.displayNameRu}</span>
            <span>
              {rowPositionSecond instanceof Function
                ? rowPositionSecond(category)
                : rowPositionSecond}
              {/* {totalNutrients[id] || '-'} */}{" "}
              <Typography variant="caption">
                {category.unitRu}
              </Typography>
            </span>
            {rowPositionThird instanceof Function
              ? rowPositionThird(category)
              : rowPositionThird}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default observer(NutrientsTotal);
