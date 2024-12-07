import { NutrientCategory, nutrientDailyNorms, nutrientsHaveDailyNorm, nutrientsPadding } from '@/store/nutrientStore/data'
import s from './NutrientPercent.module.css'
import React from 'react'
import { Typography } from '@/components/ui/Typography/Typography'

const getRoundedValue = (percentage: number, quantity, norm) => {
    if (!quantity || !norm) return null;


    // Apply different rounding strategies based on percentage range
    if (percentage < 1) {
        return percentage.toFixed(2); // Two decimal places for very small percentages
    } else if (percentage < 10) {
        return percentage.toFixed(1); // One decimal place for small percentages
    } else {
        return Math.round(percentage); // No decimals for larger percentages
    }
};

const getBackgroundColor = (percent: number) => {
    if (!percent) return 'transparent'
    if (percent <= 30) return '#ccc'; // Gray for 0-30%
    if (percent <= 60) return '#ffc107'; // Yellow for 30-60%
    return '#4caf50'; // Green for >60%
};

const nutrientDailyNormExist = (nutrientId: number): boolean => {
    return nutrientsHaveDailyNorm[nutrientId]
}

const getTextColor = (percent: number) => {
    return percent >= 100 ? 'white' : 'black'
};
type Props = {
    nutrientQuantity: number,
    nutrientId: number
}
const NutrientPercent = ({ nutrientQuantity, nutrientId }: Props) => {
    const normValue = nutrientDailyNorms[nutrientId]
    const percentage = (nutrientQuantity / normValue) * 100
    const value = getRoundedValue(percentage, nutrientQuantity, normValue);

    const backgroundColor = getBackgroundColor(percentage);
    const textColor = getTextColor(percentage);
    const backgroundWidth = Math.min(percentage, 100);

    const nutrientDailyNorm = nutrientDailyNormExist(nutrientId)

    return (
        <span className={s.percent} style={{
            color: textColor
        }}>
            <div
                className={s.backgroundFill}
                style={{
                    width: `${backgroundWidth}%`,
                    backgroundColor,
                }}
            />
            {
                nutrientDailyNorm && <>
                    {value ?? '-'}
                    {' '}

                    <Typography variant='caption'>%</Typography>
                </>
            }
        </span>
    )
}

export default NutrientPercent