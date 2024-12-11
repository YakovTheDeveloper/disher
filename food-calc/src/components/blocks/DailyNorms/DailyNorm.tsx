import NutrientsList from "@/components/blocks/NutrientsTotal/NutrientsList/NutrientsList";
import NutrientsTotal from "@/components/blocks/NutrientsTotal/NutrientsTotal";
import EditableText from "@/components/ui/EditableText/EditableText";
import NumberInput from "@/components/ui/Input/InputNumber";
import {
  DraftNormStore,
  UserNormStore,
} from "@/store/dailyNormStore/dailyNormStore";
import { observer } from "mobx-react-lite";
import React from "react";

type Props = {
  store: DraftNormStore | UserNormStore;
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
      <NutrientsTotal key={store.id}>
        <NutrientsList
          wrap
          rowPositionSecond={(category) => (
            <NumberInput
              max={4}
              value={nutrients[category.name]}
              onChange={(value) => updateNutrient(category.name, value)}
            />
          )}
        />
      </NutrientsTotal>
      {children}
    </>
  );
};

export default observer(DailyNorm);
