import { productStore } from '@/store/rootStore'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React from 'react'

const DishLoader = ({ isLoading }) => {

    // const isLoading2 = loadingState.getLoading('getOne', id)


    console.log("FAFA isLoading", isLoading)


    return (
        <div>{isLoading ? 'loading' : 'ready'}</div>
    )
}

export default observer(DishLoader)