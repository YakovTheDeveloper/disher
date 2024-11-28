import React from 'react'
import DishItem from './DishItem/DishItem'
import { observer } from "mobx-react-lite"
import { productStore } from '../../../store/rootStore'
import { IMenu } from '../../../types/Menu/Menu'
import { DishStore } from '@/store/rootDishStore/dishStore/dishStore'
import s from './Dish.module.css'
import Container from '@/components/ui/Container/Container'
import { Typography } from '@/components/ui/Typography/Typography'

type Props = {
    menu: IMenu
    store: DishStore
    children: React.ReactNode
}

function Dish(props: Props) {
    const { store, children } = props
    const { products = [], setProductQuantity, removeProduct, id, save, name, productsEmpty } = store
    const { getLoadingStatus } = productStore

    return (
        <section className={s.dish}>
            <Typography align='center' variant='h1'>{name}</Typography>
            <Container vertical>
                {/* <h4>Продукты</h4> */}
                {productsEmpty && <>
                    <Typography variant='caption'>Список пуст</Typography>
                    <p>Можно добавить продукты, воспользовавшись поиском</p>
                </>}
                <div className={s.products}>
                    {products.map(product =>
                        <DishItem
                            key={product.id}
                            product={product}
                            setProductQuantity={setProductQuantity}
                            removeProduct={removeProduct}
                            isLoading={getLoadingStatus(product.id)}
                        />)}

                </div>
            </Container>

            <div className={s.actions}>
                {children}
            </div>
        </section>
    )
}


export default observer(Dish)

