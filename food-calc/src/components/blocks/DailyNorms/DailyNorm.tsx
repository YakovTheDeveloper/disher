import Actions from "@/components/blocks/common/Actions/Actions";
import NutrientsList from "@/components/blocks/NutrientsTotal/NutrientsList/NutrientsList";
import NutrientsTotal from "@/components/blocks/NutrientsTotal/NutrientsTotal";
import EditableText from "@/components/ui/EditableText/EditableText";
import NumberInput from "@/components/ui/Input/InputNumber";
import { Typography } from "@/components/ui/Typography/Typography";
import {
  DraftNormStore,
  UserNormStore,
} from "@/store/dailyNormStore/dailyNormStore";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React from "react";

type Props = {
  store: DraftNormStore | UserNormStore;
};
const DailyNorm = ({ store }: Props) => {
  const { nutrients, updateNutrient, name } = store;

  console.log('nutrients[category.id]', toJS(nutrients))

  return (
    <div>
      <NutrientsTotal>
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
      <Actions store={store} variant="norm" />
    </div>
  );
};

export default observer(DailyNorm);
