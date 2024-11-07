import React, { useEffect } from 'react'
import { IMenu, IProductBase } from '../../../types/menu/Menu'
import { IProduct } from '../../../types/product/product'
import { observer } from 'mobx-react'
import { rootMenuStore } from '../../../store/rootStore'
import { toJS } from 'mobx'

// const calc = (products: IProductBase[]) => {

//     const total: Record<string, number> = {}

//     for (const { id, quantity } of products) {
//         if (!(id in total)) {
//             total[id] = quantity
//             continue
//         }
//         total[id] = total[id] += quantity
//     }

//     return total
// }

function NutrientsTotal() {
    const { currentMenu, currentMenuId } = rootMenuStore

    const total = currentMenu?.calculations.totalNutrients

    useEffect(() => {


        return () => {
            currentMenu.calculations.resetNutrients()
        }


    }, [currentMenuId])


    return (
        <div key={currentMenuId}>
            Total:
            {JSON.stringify(total)}
        </div>
    )
}


export default observer(NutrientsTotal)