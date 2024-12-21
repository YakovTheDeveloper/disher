import NutrientsList from "@/components/blocks/NutrientsTotal/NutrientsList/NutrientsList";
import {
    DefaultNormStore,
} from "@/store/dailyNormStore/dailyNormStore";
import { defaultNutrients } from "@/store/nutrientStore/data";
import { observer } from "mobx-react-lite";
import React from "react";
import s from '../DailyNorm.module.css'
import { Typography } from "@/components/ui/Typography/Typography";

const nutrientsPartOne = defaultNutrients.slice(0, defaultNutrients.length / 2)

const nutrientsPartTwo = defaultNutrients.slice(defaultNutrients.length / 2, defaultNutrients.length)

type Props = {
    store: DefaultNormStore
};
const DefaultDailyNorm = ({ store }: Props) => {
    const { nutrients, name } = store;

    return (
        <>
            <Typography variant="h1">
                {name}
            </Typography>
            <div className={s.container}>
                <NutrientsList
                    nutrients={nutrientsPartOne}
                    rowPositionSecond={(category) => (
                        <Typography>{nutrients[category.name]}</Typography>
                    )}
                />
                <NutrientsList
                    nutrients={nutrientsPartTwo}
                    rowPositionSecond={(category) => (
                        <Typography>{nutrients[category.name]}</Typography>
                    )}
                />
            </div>
        </>
    );
};

export default observer(DefaultDailyNorm);
