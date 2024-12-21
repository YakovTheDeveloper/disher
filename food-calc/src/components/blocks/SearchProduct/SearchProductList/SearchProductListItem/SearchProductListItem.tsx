import React from 'react'
import s from './SearchProductListItem.module.css'
import { rootDishStore } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import { toJS } from 'mobx'
import clsx from 'clsx'

type Props = {
  onClick: () => void
  productId: number
  productIds: number[]
  hasProduct: (productId: number, productIds: number[]) => boolean
  children: React.ReactNode
}

const SearchProductListItem = ({ onClick, productId, children, hasProduct, productIds }: Props) => {

  const isInCurrentDish = hasProduct(productId, productIds)

  const classNames = clsx([s.product, isInCurrentDish && s.active])

  return (
    <li onClick={onClick} className={classNames}>
      <span>{children}</span>
      <span>{isInCurrentDish && 'В списке'}</span>
    </li>
  )
}

export default observer(SearchProductListItem)

