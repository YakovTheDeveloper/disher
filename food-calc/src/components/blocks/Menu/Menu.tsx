import React, { useEffect } from 'react'
import MenuItem from './MenuItem/MenuItem'
import { observer } from "mobx-react-lite"
import {  rootMenuStore, productStore } from '../../../store/rootStore'
import { IMenu } from '../../../types/Menu/Menu'
import { fetchGetProductWithNutrients } from '@/api/product'
import { action, toJS } from 'mobx';
import { getMenuProductIds } from '@/domain/menu'
import { isEmpty } from '@/lib/empty'
import NutrientsTotal from '@/components/blocks/NutrientsTotal/NutrientsTotal'

type Props = {
    menu: IMenu
}

function fetchMissedProductNutrients(menu: IMenu) {

    const { setProductNutrientData, getMissingProductIds } = productStore

    const productIdsInMenu = getMenuProductIds(menu)
    const missingProducts = getMissingProductIds(productIdsInMenu)

    console.log('productIdsInMenu', productIdsInMenu)
    console.log('missingProducts', missingProducts)

    if (isEmpty(missingProducts)) return

    fetchGetProductWithNutrients(missingProducts).then(
        action("fetchSuccess", res => {
            res && setProductNutrientData(res)

            // add to totalNutrients
        }),
        action("fetchError", error => {
        })
    )
}



function Menu() {
    const { currentMenu, saveNew, currentMenuId } = rootMenuStore
    const menu = currentMenu


    useEffect(() => {
        console.log(menu?.menu)
    }, [menu?.menu?.products])

    useEffect(() => {
        fetchMissedProductNutrients(currentMenu?.menu)
    }, [currentMenu, currentMenu?.menu?.products.length])

    const onSave = () => {
        saveNew(menu.createMenuPayload)
    }

    const onUpdate = () => {

    }



    return (
        <section key={currentMenuId}>
            <h2>Add products</h2>
            <div>{menu?.menu?.products.map(product => <MenuItem key={product.id} product={product} setProductQuantity={menu?.setProductQuantity} calculations={menu?.calculations} />)}</div>
            <button onClick={onSave}>Сохранить</button>
        </section>
    )
}

export default observer(Menu)