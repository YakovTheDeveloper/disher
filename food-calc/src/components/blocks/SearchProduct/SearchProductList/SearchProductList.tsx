import React from 'react'
import { rootDishStore, productStore, currentCalculationStore, addProductToDishUseCase, Flows } from '@/store/rootStore'
import { IProductBase } from '../../../../types/menu/Menu'
import { fromHash, generateHash } from '../../../../lib/hash/hash'
import { observer } from 'mobx-react-lite'
import s from './SearchProductList.module.css'
import clsx from 'clsx'
import SearchProductListItem from '@/components/blocks/SearchProduct/SearchProductList/SearchProductListItem/SearchProductListItem'
import { hasProduct } from '@/domain/common'

const SearchProductList = ({ searchValue }) => {

    if (!searchValue) return null
    const products = productStore.productsBase

    const found = products.filter(({ name = '', nameRu }) => {
        return nameRu.toLowerCase().includes(searchValue.toLowerCase()) || name.toLowerCase().includes(searchValue.toLowerCase())
    })

    async function onAdd(product: IProductBase) {
        addProductToDishUseCase.execute({
            ...product,
            quantity: 100
        })
    }

    return (
        <ul className={clsx(s.list)}>
            {found.map((product) =>
                <SearchProductListItem
                    key={product.id}
                    productId={product.id}
                    onClick={() => onAdd(product)}
                    hasProduct={hasProduct}
                    productIds={rootDishStore.currentDish?.productIds}
                >
                    {product.nameRu}
                </SearchProductListItem>)}
        </ul>
    )
}

export default observer(SearchProductList)