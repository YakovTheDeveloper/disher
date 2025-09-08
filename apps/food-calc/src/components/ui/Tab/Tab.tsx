import React from 'react'
import s from './Tab.module.css'
import clsx from 'clsx'
import { Typography } from '@/components/ui/Typography/Typography'
import PlusIcon from "@/assets/icons/plus.svg";


export type TabProps = {
  onClick: VoidFunction
  children: React.ReactNode
  isActive: boolean
  after?: React.ReactNode
  before?: React.ReactNode
  label?: React.ReactNode
  disabled?: boolean
  containerClassName?: string
  innerClassName?: string
}
const Tab = (props: TabProps) => {
  const { onClick, children, isActive, before, after, label, containerClassName, disabled, innerClassName } = props
  return (
    <li className={clsx([s.tab, isActive && [s.active, s.rounded], containerClassName, disabled && s.disabled])}>

      {label && (
        <Typography className={s.draftCaption} align='center' variant='caption'>
          {label}
        </Typography>
      )}


      <div className={clsx([s.tabContent])}>
        {before &&
          <div className={s.before}>
            {before}
          </div>
        }
        <div className={clsx([s.inner, innerClassName])} onClick={onClick}>
          {children}
          {after &&
            <div className={s.after}>
              {after}
            </div>
          }
        </div>
      </div>


    </li>
  )
}

export default Tab   