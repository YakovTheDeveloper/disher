import React from 'react'
import { IMenu, IProductBase } from '../../../types/menu/Menu'
import { IProduct } from '../../../types/product/product'
import { observer } from 'mobx-react'
import { calculationStore, Menus } from '../../../store/rootStore'

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
    const { currentMenu } = Menus
    const { totalNutrients } = calculationStore




    return (
        <div>
            Total:
            {JSON.stringify(totalNutrients)}
        </div>
    )
}

export default observer(NutrientsTotal)