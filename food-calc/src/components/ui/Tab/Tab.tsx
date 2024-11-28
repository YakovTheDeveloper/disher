import React from 'react'
import s from './Tab.module.css'
import clsx from 'clsx'
type Props = {
  onClick: VoidFunction
  children: string
  isActive: boolean
  after: React.ReactNode
}
const Tab = (props: Props) => {
  const { onClick, children, isActive, after, draft } = props
  return (
    <li className={clsx([s.tab, isActive && s.active, draft && s.draft])}>
      <div className={clsx([s.inner])} onClick={onClick}>{children}
      </div>
      {after &&
        <div className={s.after}>
          {after}
        </div>
      }
    </li>
  )
}

export default Tab   