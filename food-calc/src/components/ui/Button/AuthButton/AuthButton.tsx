import React from 'react'
import s from './AuthButton.module.css'

const AuthButton = ({ onClick, children }) => {
    return (
        <button className={s.authButton} onClick={onClick}>{children}</button>
    )
}

export default AuthButton