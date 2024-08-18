import React, { useEffect } from 'react'
import MenuItem from './MenuItem/MenuItem'
import { observer } from "mobx-react-lite"
import { Menus, productStore } from '../../../store/rootStore'
import { IMenu } from '../../../types/Menu/Menu'
import { fetchGetProductWithNutrients } from '@/api/product'
import { toJS } from 'mobx';
import { getMenuProductIds } from '@/domain/menu'
import { isEmpty } from '@/lib/empty'

type Props = {
    menu: IMenu
}


const useMenu = (menu: IMenu) => {
    const { setProductNutrientData, getMissingProductIds } = productStore

    const productIdsInMenu = getMenuProductIds(menu)
    const missingProducts = getMissingProductIds(productIdsInMenu)

    console.log('missingProducts', missingProducts)

    useEffect(() => {
        if (isEmpty(missingProducts)) return
        fetchGetProductWithNutrients(missingProducts).then(res => {
            res && setProductNutrientData(res)
        })
    }, [menu])
}

function Menu({ menu }: Props) {




    useMenu(menu)
    useEffect(() => {
        console.log('productStore.productToNutrients', toJS(productStore.productToNutrients))
    }, [productStore.productToNutrients])



    const { products, description, name, id } = menu

    return (
        <section>
            <h2>{id}</h2>
            <div>{products.map(product => <MenuItem key={product.id} menuId={id} product={product} />)}</div>
        </section>
    )
}

export default observer(Menu)