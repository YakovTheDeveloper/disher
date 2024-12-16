import { NutrientCategory, nutrientsHaveDailyNorm, nutrientsPadding } from '@/store/nutrientStore/data'
import s from './NutrientPercent.module.css'
import React from 'react'
import { Typography } from '@/components/ui/Typography/Typography'
import { DailyNorm } from '@/types/norm/norm';
import FindRichButton from '@/components/blocks/NutrientsTotal/FindRichButton/FindRichButton';
import { uiStore } from '@/store/rootStore';
import { Modals } from '@/store/uiStore/modalStore/modalStore';
import { NutrientData } from '@/types/nutrient/nutrient';
import { observer } from 'mobx-react-lite';

const getRoundedValue = (percentage: number, quantity, norm) => {
    if (!quantity || !norm) return null;



    if (percentage < 1) {
        return percentage.toFixed(2);
    } else if (percentage < 10) {
        return percentage.toFixed(1);
    } else {
        return Math.round(percentage);
    }
};

const getBackgroundColor = (percent: number) => {
    if (!percent) return 'transparent'
    if (percent <= 30) return '#ccc';
    if (percent <= 60) return '#ffc107';
    return '#4caf50'; // Green for >60%
};

const nutrientHasDailyNorm = (nutrientId: string): boolean => {
    return nutrientsHaveDailyNorm[nutrientId]
}

const getTextColor = (percent: number) => {
    return percent >= 100 ? 'white' : 'black'
};
type Props = {
    nutrientQuantity: number,
    nutrient: NutrientData
    dailyNutrientNorm: DailyNorm
    children?: React.ReactNode
    showFindRichProduct?: boolean
    getComponentColorStyle?: (color: string, backgroundColor: string) => void
}
const NutrientPercent = ({ nutrientQuantity, nutrient, dailyNutrientNorm, children, getComponentColorStyle, showFindRichProduct }: Props) => {
    const { name } = nutrient
    const haveDailyNorm = nutrientHasDailyNorm(name)

    const normValue = dailyNutrientNorm[name]
    const percentage = (nutrientQuantity / normValue) * 100
    const value = getRoundedValue(percentage, nutrientQuantity, normValue);

    const backgroundColor = getBackgroundColor(percentage);
    const textColor = getTextColor(percentage);
    const percantageView = Math.min(percentage, 100);


    const fillStyle = haveDailyNorm ? {
        width: `${percantageView}%`,
        backgroundColor,
    } : undefined

    getComponentColorStyle?.(textColor, backgroundColor)


    return (
        <span className={s.percent} style={{
            color: textColor
        }}>
            <div
                className={s.backgroundFill}
                style={fillStyle}
            />
            {
                haveDailyNorm && <>
                    {value}
                    {' '}
                    <span className={s.pecentSign}>
                        %
                    </span>
                </>
            }
            {showFindRichProduct &&
                <FindRichButton
                    percantageView={percantageView}
                    onClick={() => uiStore.modal.openModal(Modals.NutrientRichProduct, nutrient)}
                />}
        </span>
    )
}

export default observer(NutrientPercent)