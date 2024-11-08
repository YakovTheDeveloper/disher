import React, { useEffect } from 'react'
import MenuItem from './MenuItem/MenuItem'
import { observer } from "mobx-react-lite"
import { rootMenuStore, productStore } from '../../../store/rootStore'
import { IMenu, IProductBase } from '../../../types/Menu/Menu'
import { fetchGetProductWithNutrients } from '@/api/product'
import { action, toJS } from 'mobx';
import { getMenuProductIds } from '@/domain/menu'
import { isEmpty } from '@/lib/empty'
import NutrientsTotal from '@/components/blocks/NutrientsTotal/NutrientsTotal'
import { DraftMenuStore, UserMenuStore } from '@/store/rootMenuStore/menuStore/menuStore'

type Props = {
    menu: IMenu
}

function fetchMissedProductNutrients(products: IProductBase[]) {

    const { setProductNutrientData, getMissingProductIds } = productStore
   
    const productIdsInMenu = getMenuProductIds(products)
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
    const { currentMenu, saveNew, currentMenuId, deleteCurrentMenu } = rootMenuStore
    const menu = currentMenu


    useEffect(() => {
        // console.log('__________', toJS(menu?.calculations))
    }, [currentMenu, currentMenu.products])

    useEffect(() => {
        fetchMissedProductNutrients([...currentMenu.products, ...currentMenu.additionalSourceProducts])
        // fetchMissedProductNutrients(currentMenu.products)
    }, [currentMenu, currentMenu?.products.length, currentMenu.additionalSourceProducts])

    const onSave = () => {
        // saveNew(menu.createMenuPayload)

        currentMenu.save(+currentMenuId)
    }

    const onUpdate = () => {

    }

    return (
        <section >
            <h2>Add products</h2>
            <div>{menu?.products.map(product =>
                <MenuItem key={product.id}
                    product={product}
                    setProductQuantity={menu.setProductQuantity}
                    removeProduct={menu.removeProduct}
                />)}</div>
            {/* <button onClick={onSave}>Сохранить</button> */}
            {currentMenu instanceof DraftMenuStore && <DraftActionButton onClick={onSave} />}
            {currentMenu instanceof UserMenuStore && <UserActionButton onClick={onSave} changeOccured={currentMenu.changeOccured} />}
            {currentMenu instanceof UserMenuStore && currentMenu.changeOccured && <button onClick={currentMenu.resetToInit}>Сбросить к первоначальному</button>}
            {currentMenu instanceof UserMenuStore && <button onClick={deleteCurrentMenu}>Удалить</button>}
            <div>{menu?.additionalCalculationSources.map(({ id, name }) =>
                <li>
                    {name}
                    {id}
                    <button onClick={() => currentMenu.removeAdditionalCalculationSources(id)}>
                        удалить
                    </button>
                </li>)}

            </div>
        </section>
    )
}


function ActionButton(props) {
    const { onClick, children } = props

    return (
        <button onClick={onClick}>{children}</button>
    )
}

function DraftActionButton(props) {

    return <ActionButton {...props} >Сохранить</ActionButton>
}

function UserActionButton(props) {
    const { changeOccured, ...rest } = props
    if (!changeOccured) return null
    return <ActionButton {...props} >Обновить </ActionButton>

}

export default observer(Menu)

