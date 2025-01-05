import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { Typography } from '@/components/ui/Typography/Typography';
import { NutrientData } from '@/types/nutrient/nutrient';
import s from './NutrientsList.module.css';
import { defaultNutrientsV2, nutrientsPadding } from '@/store/nutrientStore/data';

export type NutrientsListProps = {
    rowPositionFirst?: React.ReactNode | ((cat: NutrientData) => JSX.Element | null);
    rowPositionSecond?: React.ReactNode | ((cat: NutrientData) => JSX.Element);
    rowPositionThird?: React.ReactNode | ((cat: NutrientData) => JSX.Element);
    nutrientsV2?: typeof defaultNutrientsV2
    columns?: number
    filter?: Record<string, boolean>
};

const nutrientPadding = (nutrientId: number): boolean => {
    return nutrientsPadding[nutrientId]
}

const NutrientsList = ({
    rowPositionFirst,
    rowPositionSecond,
    rowPositionThird,
    nutrientsV2 = defaultNutrientsV2,
    filter,
    columns = 2
}: NutrientsListProps) => {
    return (
        <div className={clsx(s.nutrientsListContainer)} style={{
            // gridTemplateColumns: `${columns}fr`
        }}>
            {Object.entries(nutrientsV2).map(([categoryName, { content }]) => (
                <ul className={clsx(s.nutrientsList, s[categoryName])} key={categoryName}>
                    {content.map((category) => {
                        if (!filter?.[category.name]) {
                            return null
                        }
                        return (
                            <li key={category.id} className={clsx(s.nutrient)}>
                                <span className={s.cell}>
                                    {rowPositionFirst instanceof Function
                                        ? rowPositionFirst(category)
                                        : rowPositionFirst}
                                    <Typography
                                        className={clsx(nutrientPadding(category.id) ? s.offset : null)}
                                        variant="table"
                                    >
                                        {category.displayNameRu}
                                    </Typography>
                                </span>
                                <span className={s.cell}>
                                    {rowPositionSecond instanceof Function
                                        ? rowPositionSecond(category)
                                        : rowPositionSecond}
                                    <Typography variant="caption">{category.unitRu}</Typography>
                                </span>
                                {rowPositionThird instanceof Function
                                    ? rowPositionThird(category)
                                    : rowPositionThird}
                            </li>
                        )
                    })}
                </ul>
            ))}
        </div>
    );
};

export default observer(NutrientsList);
