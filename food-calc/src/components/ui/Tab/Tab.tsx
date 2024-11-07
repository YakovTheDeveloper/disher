import React from 'react'
import s from './Tab.module.css'
import clsx from 'clsx'
type Props = {
  onClick: VoidFunction
  children: string
  isActive: boolean
}
const Tab = (props: Props) => {
  const { onClick, children, isActive } = props
  return (
    <li className={clsx([s.tab, isActive && s.active])} onClick={onClick}>{children}</li>
  )
}

export default Tab   