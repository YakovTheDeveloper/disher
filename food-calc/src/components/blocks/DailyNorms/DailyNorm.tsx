import Actions from "@/components/blocks/common/Actions/Actions";
import NutrientsTotal from "@/components/blocks/NutrientsTotal/NutrientsTotal";
import EditableText from "@/components/ui/EditableText/EditableText";
import { Typography } from "@/components/ui/Typography/Typography";
import {
  DraftNormStore,
  UserNormStore,
} from "@/store/dailyNormStore/dailyNormStore";
import { observer } from "mobx-react-lite";
import React from "react";

type Props = {
  store: DraftNormStore | UserNormStore;
};
const DailyNorm = ({ store }: Props) => {
  const { nutrients, updateNutrient, name } = store;

  return (
    <div>
      <div>
        <EditableText value={name} typographyProps={{ variant: "h1" }} />
      </div>
      <NutrientsTotal
        rowPositionSecond={(category) => (
          <input
            value={nutrients[category.name]}
            onChange={(e) => updateNutrient(category.name, +e.target.value)}
          />
        )}
      />
      <Actions store={store} />
    </div>
  );
};

export default observer(DailyNorm);
