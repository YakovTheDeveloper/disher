import React, { useEffect } from 'react'
import { IMenu, IProductBase } from '../../../types/menu/Menu'
import { IProduct } from '../../../types/product/product'
import { observer } from 'mobx-react'
import { rootDishStore } from '../../../store/rootStore'
import { toJS } from 'mobx'
import { CalculationStore } from '@/store/calculationStore/calculationStore'
import { nutrientDailyNorms, nutrientsMap } from '@/store/nutrientStore/data'
import Container from '@/components/ui/Container/Container'
import { li } from 'framer-motion/client'
import { IdToQuantity } from '@/types/common/common'
import s from './NutrientsTotal.module.css'
import NutrientPercent from '@/components/blocks/NutrientsTotal/NutrientPercent/NutrientPercent'
import { Typography } from '@/components/ui/Typography/Typography'
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
const nutrientCategories = Object.values(nutrientsMap)

type Props = {
    totalNutrients: IdToQuantity
    loading: boolean
}
const NutrientsTotal = ({ totalNutrients, loading }: Props) => {





    return (
        <Container>
            <div>
                {loading && <span>Loading...</span>}
            </div>
            <ul>
                {nutrientCategories.map(({ displayName, id, unit }) => (
                    <li className={s.nutrient}>
                        <span>{displayName}</span>
                        <span>
                            {totalNutrients[id] || '-'}
                            {' '}
                            <Typography variant='caption'>
                                {unit}
                            </Typography>
                        </span>
                        <NutrientPercent nutrientId={id} nutrientQuantity={totalNutrients[id]} />
                    </li>
                ))}
            </ul>
        </Container>
    )
}


export default observer(NutrientsTotal)