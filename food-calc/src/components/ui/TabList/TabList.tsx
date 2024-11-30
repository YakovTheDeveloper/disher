import React from 'react'
import s from './TabList.module.css'

type Props = {
  children: React.ReactNode
}
const TabList = (props: Props) => {
  const { children } = props
  return (
    <ul className={s.tabList}>{children}</ul>
  )
}

export default TabList   