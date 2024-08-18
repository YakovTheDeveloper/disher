import React from 'react'
import { Menus, productStore, rootStore } from '@store/rootStore'
import { IProductBase } from '../../../../types/menu/Menu'
import { fromHash, generateHash } from '../../../../lib/hash/hash'
import { observer } from 'mobx-react-lite'


const products = [
    {
        name: 'Apples',
        id: '1',
    },
    {
        name: 'Oranges',
        id: '2',
    },

]


const SearchProductList = ({ searchValue }) => {

    if (!searchValue) return null

    const products = productStore.productsBase

    const found = products.filter(({ name, nameRu }) => {
        return name.toLowerCase().includes(searchValue.toLowerCase()) || nameRu.toLowerCase().includes(searchValue.toLowerCase())
    })
    console.log("found", found)
    function onAdd(product: IProductBase) {
        Menus.addTo({
            ...product,
            quantity: 0
        })
    }



    return (
        <ul>
            {found.map((product) => <li key={product.id} onClick={() => onAdd(product)}>{product.name}</li>)}
        </ul>
    )
}

export default observer(SearchProductList)