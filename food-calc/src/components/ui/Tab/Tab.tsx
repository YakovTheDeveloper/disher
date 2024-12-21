import React from 'react'
import s from './Tab.module.css'
import clsx from 'clsx'
import { Typography } from '@/components/ui/Typography/Typography'


type Props = {
  onClick: VoidFunction
  children: string
  isActive: boolean
  after?: React.ReactNode
  before?: React.ReactNode
  label?: string
  draft?: boolean,
  disabled?: boolean
  containerClassName?: string
  innerClassName?: string
}
const Tab = (props: Props) => {
  const { onClick, children, isActive, before, after, label, draft, containerClassName, disabled, innerClassName } = props
  return (
    <li className={clsx([s.tab, isActive && s.active, draft && s.draft, containerClassName, disabled && s.disabled])}>

      {draft && (
        <Typography className={s.draftCaption} align='center' variant='caption'>
          черновик
        </Typography>
      )}

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
          <Typography>
            {children}
          </Typography>
        </div>
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