import React, { useState } from "react";
import { observer } from "mobx-react";
import { defaultNutrients, NutrientCategory, nutrientsMap, nutrientsPadding } from "@/store/nutrientStore/data";
import s from "./NutrientsTotal.module.css";
import { Typography } from "@/components/ui/Typography/Typography";
import clsx from "clsx";
import NutrientsList, { NutrientsListProps } from "@/components/blocks/NutrientsTotal/NutrientsList/NutrientsList";
import { NutrientName } from "@/types/nutrient/nutrient";
import Button from "@/components/ui/Button/Button";
import { isEmpty, isNotEmpty } from "@/lib/empty";

const nutrientCategories = Object.values(nutrientsMap);
const nutrientPadding = (nutrientId: number): boolean => {
  return nutrientsPadding[nutrientId]
}

type Props = {
  children?: React.ReactNode;
} & NutrientsListProps;

const NutrientsTotal = ({
  children,
  rowPositionSecond,
  rowPositionThird
}: Props) => {

  const [selected, setSelected] = useState<NutrientName[]>([])
  const [showOnlySelectedNutrients, setShowOnlySelected] = useState(false)

  const onRowClick = (categoryName: NutrientName) => {
    setSelected(prev => {
      if (!prev) return []
      if (prev?.includes(categoryName)) {
        return prev.filter(name => name !== categoryName)
      }
      return [...prev, categoryName]
    })
  }

  const cancelSelection = () => {
    setSelected([])
    setShowOnlySelected(false)
  }

  console.log('selected', selected)

  const someSelected = isNotEmpty(selected)

  const filteredNutrients = showOnlySelectedNutrients ? defaultNutrients.filter(({ name }) => selected?.includes(name)) : defaultNutrients

  return (
    <div className={s.nutrientsTotal}>

      <header>
        {someSelected &&
          <>
            {!showOnlySelectedNutrients && <Button onClick={() => setShowOnlySelected(true)}>Показать только выделенные</Button>}
            {!showOnlySelectedNutrients && <Button onClick={cancelSelection}>отменить</Button>}
            {showOnlySelectedNutrients && <Button onClick={cancelSelection}>Показать все</Button>}
          </>
        }

      </header>
      {/* {children} */}

      <NutrientsList
        rowPositionSecond={rowPositionSecond}
        rowPositionThird={rowPositionThird}
        selectedRows={selected}
        onRowClick={onRowClick}
        nutrients={filteredNutrients}
      />
    </div>
  );
};

export default observer(NutrientsTotal);
