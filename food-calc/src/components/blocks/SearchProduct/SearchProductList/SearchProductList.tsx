import React from 'react'
import { rootDishStore, productStore, rootStore } from '@store/rootStore'
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

    const found = products.filter(({ name, nameRu }) => {
        return name.toLowerCase().includes(searchValue.toLowerCase()) || nameRu.toLowerCase().includes(searchValue.toLowerCase())
    })

    async function onAdd(product: IProductBase) {

        const status = productStore.getLoadingStatus(product.id)
        if (!status) {
            productStore.setLoadingStatus(product.id, { isLoading: true, status: 'pending' })
            productStore.fetchAndSetProductNutrientsData([+product.id]).then((res) => {
                if (!res) return

            }).finally(() => productStore.setLoadingStatus(product.id, { isLoading: false, status: 'loaded' }))
        }


        rootDishStore.currentDish?.toggleProduct({
            ...product,
            quantity: 0
        })
    }

    // console.log("rootDishStore.currentDish?.hasProduct",rootDishStore.currentDish?.hasProduct)


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
                    {product.name}
                </SearchProductListItem>)}
        </ul>
    )
}

export default observer(SearchProductList)