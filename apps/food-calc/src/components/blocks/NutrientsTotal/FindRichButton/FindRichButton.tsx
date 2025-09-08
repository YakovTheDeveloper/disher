import DiamondIcon from "@/assets/icons/diamond.svg";
import s from './FindRichButton.module.css'
import React from 'react'
import { NutrientData } from "@/types/nutrient/nutrient";

type Props = {
    percantageView: number
    onClick: () => void
}

const FindRichButton = ({ percantageView, onClick }: Props) => {
    const alpha = Math.max(percantageView / 100, 0.4)

    const color = `rgba(76, 175, 80, ${alpha})`

    return (
        <button
            className={s.findButton}
            onClick={onClick}
        >
            <DiamondIcon
                className={s.icon}
                style={{ color }} />
        </button>
    )
}

export default FindRichButton