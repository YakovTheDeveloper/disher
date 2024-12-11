import { NutrientCategory, nutrientsHaveDailyNorm, nutrientsPadding } from '@/store/nutrientStore/data'
import s from './NutrientPercent.module.css'
import React from 'react'
import { Typography } from '@/components/ui/Typography/Typography'
import { DailyNorm } from '@/types/norm/norm';

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
    nutrientId: string
    dailyNutrientNorm: DailyNorm
    children?: React.ReactNode
}
const NutrientPercent = ({ nutrientQuantity, nutrientId, dailyNutrientNorm, children }: Props) => {
    const haveDailyNorm = nutrientHasDailyNorm(nutrientId)

    const normValue = dailyNutrientNorm[nutrientId]
    const percentage = (nutrientQuantity / normValue) * 100
    const value = getRoundedValue(percentage, nutrientQuantity, normValue);

    const backgroundColor = getBackgroundColor(percentage);
    const textColor = getTextColor(percentage);
    const backgroundWidth = Math.min(percentage, 100);


    const fillStyle = haveDailyNorm ? {
        width: `${backgroundWidth}%`,
        backgroundColor,
    } : undefined

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
                    {value ?? '-'}
                    {' '}
                    <Typography
                        variant='caption'
                        style={{
                            color: 'inherit'
                        }}>
                        %
                    </Typography>
                </>
            }
            {children}
        </span>
    )
}

export default NutrientPercent