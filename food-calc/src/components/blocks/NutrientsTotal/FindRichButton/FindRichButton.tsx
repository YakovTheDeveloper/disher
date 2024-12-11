import DiamondIcon from "@/assets/icons/diamond.svg";
import s from './FindRichButton.module.css'
import React from 'react'

type Props = {
    nutrientId: number
}

const FindRichButton = ({ nutrientId }) => {
    return (
        <button className={s.findButton}>
            <DiamondIcon className={s.icon} />
        </button>
    )
}

export default FindRichButton