import React from "react";
import { observer } from "mobx-react";
import { NutrientCategory, nutrientsMap, nutrientsPadding } from "@/store/nutrientStore/data";
import s from "./NutrientsTotal.module.css";
import { Typography } from "@/components/ui/Typography/Typography";
import clsx from "clsx";
import NutrientsList from "@/components/blocks/NutrientsTotal/NutrientsList/NutrientsList";

const nutrientCategories = Object.values(nutrientsMap);
const nutrientPadding = (nutrientId: number): boolean => {
  return nutrientsPadding[nutrientId]
}

type Props = {
  children?: React.ReactNode;
};
const NutrientsTotal = ({
  children
}: Props) => {
  return (
    <div className={s.nutrientsTotal}>
      {children}
    </div>
  );
};

export default observer(NutrientsTotal);
