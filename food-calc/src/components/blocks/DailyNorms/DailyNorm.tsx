import NutrientsList from "@/components/blocks/NutrientsTotal/NutrientsList/NutrientsList";
import NutrientsTotal from "@/components/blocks/NutrientsTotal/NutrientsTotal";
import EditableText from "@/components/ui/EditableText/EditableText";
import NumberInput from "@/components/ui/Input/InputNumber";
import {
  DefaultNormStore,
  DraftNormStore,
  UserNormStore,
} from "@/store/dailyNormStore/dailyNormStore";
import { defaultNutrients } from "@/store/nutrientStore/data";
import { observer } from "mobx-react-lite";
import React from "react";
import s from './DailyNorm.module.css'

const nutrientsPartOne = defaultNutrients.slice(0, defaultNutrients.length / 2)

const nutrientsPartTwo = defaultNutrients.slice(defaultNutrients.length / 2, defaultNutrients.length)

type Props = {
  store: DraftNormStore | UserNormStore
  children: React.ReactNode
};
const DailyNorm = ({ store, children }: Props) => {
  const { nutrients, updateNutrient, name } = store;

  return (
    <>
      <EditableText
        value={name}
        typographyProps={{ variant: "h1" }}
        onChange={store.setName}
      />
      <div className={s.container}>
        <NutrientsList
          nutrients={defaultNutrients}
          rowPositionSecond={(category) => (
            <NumberInput
              value={nutrients[category.name]}
              onChange={(value) => updateNutrient(category.name, value)}
            />
          )}
        />
      </div>
      {children}
    </>
  );
};

export default observer(DailyNorm);
