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
import SelectableInput from "@/components/ui/Button/SelectableInput/SelectableInput";
import EyeIcon from "@/assets/icons/eye.svg";

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
  const [editMode, setEditMode] = useState(false)

  const onRowClick = (categoryName: NutrientName) => {
    console.log(categoryName)
    setSelected(prev => {
      if (!prev) return []
      if (prev?.includes(categoryName)) {
        return prev.filter(name => name !== categoryName)
      }
      return [...prev, categoryName]
    })
  }

  const cancelSelection = () => {
    // setSelected([])
    setShowOnlySelected(false)
  }

  const onFilterClick = () => {
    setEditMode(prev => !prev)
  }

  const showAll = () => {
    setEditMode(false)
    setShowOnlySelected(false)
  }

  const showFiltered = () => {
    setEditMode(false)
    setShowOnlySelected(true)
  }

  const filteredNutrients = showOnlySelectedNutrients ? defaultNutrients.filter(({ name }) => selected?.includes(name)) : defaultNutrients



  return (
    <div className={s.nutrientsTotal}>

      {/* <header className={s.header}>
        <button className={s.filterButton} onClick={onFilterClick}>
          <EyeIcon />
        </button>
        {editMode &&
          <>
            {editMode && <Button variant="secondary" onClick={showAll}>Все</Button>}
            {!editMode && <Button variant="secondary" onClick={cancelSelection}>отменить</Button>}
            {editMode && <Button variant="secondary" onClick={showFiltered}>Только выбранные</Button>}
          </>
        }

      </header> */}

      <NutrientsList
        rowPositionFirst={(nutrient) => {
          if (!editMode) return null
          return (
            <SelectableInput
              type="checkbox"
              onChange={() => onRowClick(nutrient.name)}
              isChecked={selected?.includes(nutrient.name)}
              id={nutrient.id}
              name={nutrient.name}
            />
          )
        }}
        rowPositionSecond={rowPositionSecond}
        rowPositionThird={rowPositionThird}
        nutrients={filteredNutrients}
      />

    </div>
  );
};

export default observer(NutrientsTotal);
