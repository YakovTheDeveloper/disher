import clsx from 'clsx'
import React from 'react'
import s from './RemoveButton.module.css'
const RemoveButton = (props) => {
    const {onClick} = props
    return (
        <button className={clsx(s.removeButton)} onClick={onClick}>[x]</button>
    )
}

export default RemoveButton