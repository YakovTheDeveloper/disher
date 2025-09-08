import DraftActions2 from '@/components/blocks/common/Actions/DraftActions2'
import UserActions2 from '@/components/blocks/common/Actions/UserActions2'
import ProductsMain from '@/components/blocks/Products/ProductsMain/ProductsMain'
import ProductTabs from '@/components/blocks/Products/ProductTabs/ProductTabs'
import Layout from '@/components/common/Layout/Layout'
import { isEmpty } from '@/lib/empty'
import { DraftProductStore, ProductStore, UserProductStore } from '@/store/productStore/rootProductStore'
import { Flows, rootProductStore } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'



const ProductsPage = () => {

    useEffect(() => {
        rootProductStore.fetchManager.getAll()
            .then(res => {
                if (res.isError) return
                rootProductStore.addLocalBulk(res.data.map(product => new UserProductStore(product)))

                res.data.forEach((product) => {
                    if (!rootProductStore.userStoresMap[product.id]) return
                    const correspondingStore = rootProductStore.userStoresMap[product.id]
                    const { portions, nutrients } = correspondingStore
                    if (isEmpty(portions)) correspondingStore.setPortions(product.portions)
                    if (isEmpty(nutrients)) correspondingStore.setNutrients(product.nutrients)
                })
            })
    }, [])

    const { currentStore, loadingState } = rootProductStore
    if (!currentStore) return

    return (
        <Layout
            left={<ProductTabs />}
            center={
                <ProductsMain store={currentStore} >
                    {
                        currentStore instanceof DraftProductStore
                            ? null
                            : <UserActions2
                                store={currentStore}
                                loadingState={loadingState}
                                update={() => Flows.Product.updatePart()}
                            />
                    }
                </ProductsMain>
            }
        />
    )
}

export default observer(ProductsPage)

