import React from 'react'
import MenuItem from './MenuItem/MenuItem'
import { IMenu } from '../../../types/menu/Menu'
import { observer } from "mobx-react-lite"
import { Menus } from '../../../store/rootStore'


type Props = {
    menu: IMenu
}

function Menu({ menu }: Props) {

    if (!menu) return null

    const { products, description, name, id } = menu

    return (
        <section>
            <h2>{id}</h2>
            <div>{products.map(product => <MenuItem key={product.id} menuId={id} product={product} />)}</div>
        </section>
    )
}

export default observer(Menu)