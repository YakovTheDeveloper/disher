import React, { useState, useEffect, useRef, useCallback } from 'react'
import { rootDishStore, productStore, currentCalculationStore, Flows } from '@/store/rootStore'
import { IProductBase } from '../../../../types/menu/Menu'
import { observer } from 'mobx-react-lite'
import clsx from 'clsx'
import s from './SearchProductList.module.css'
import SearchProductListItem from '@/components/blocks/SearchProduct/SearchProductList/SearchProductListItem/SearchProductListItem'
import { hasProduct } from '@/domain/common'
import { isEmpty } from '@/lib/empty'

type Props = {
    searchValue: string
    hideList: VoidFunction
}

const ROW_HEIGHT = 50 // Height of each row in pixels
const BUFFER = 5 // Number of extra items to render above and below the visible range

const SearchProductList = ({ searchValue, hideList }: Props) => {
    const [startIndex, setStartIndex] = useState(0)
    const [endIndex, setEndIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement | null>(null)

    if (!searchValue) return null
    const products = productStore.productsBase

    const found = products.filter(({ name }) =>
        name.toLowerCase().includes(searchValue.toLowerCase())
    )

    const handleScroll = useCallback(() => {
        if (containerRef.current) {
            const scrollTop = containerRef.current.scrollTop
            const visibleCount = Math.ceil(containerRef.current.clientHeight / ROW_HEIGHT)
            const newStartIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER)
            const newEndIndex = Math.min(found.length, newStartIndex + visibleCount + 2 * BUFFER)

            setStartIndex(newStartIndex)
            setEndIndex(newEndIndex)
        }
    }, [found.length])

    useEffect(() => {
        if (containerRef.current) {
            setEndIndex(Math.ceil(containerRef.current.clientHeight / ROW_HEIGHT) + BUFFER)
            containerRef.current.addEventListener('scroll', handleScroll)
        }
        return () => {
            containerRef.current?.removeEventListener('scroll', handleScroll)
        }
    }, [handleScroll])

    async function onAdd(product: IProductBase) {
        hideList()
        Flows.Dish.addProduct({
            ...product,
            quantity: 100
        })
    }

    //todo empty list message

    return (
        <div ref={containerRef} className={s.listContainer}>
            <div style={{ height: found.length * ROW_HEIGHT }} className={s.spacer}>
                <ul
                    className={clsx(s.list)}
                    style={{ transform: `translateY(${startIndex * ROW_HEIGHT}px)` }}
                >
                    {isEmpty(found) && <li className={s.noResults}>Ничего не найдено</li>}
                    {found.slice(startIndex, endIndex).map((product) => (
                        <SearchProductListItem
                            key={product.id}
                            productId={product.id}
                            onClick={() => onAdd(product)}
                            hasProduct={hasProduct}
                            productIds={rootDishStore.currentStore?.productIds}
                        >
                            {product.name}
                        </SearchProductListItem>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default observer(SearchProductList)
