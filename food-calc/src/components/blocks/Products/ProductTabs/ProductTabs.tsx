import { Tab } from '@/components/ui/Tab'
import DraftTab from '@/components/ui/Tab/DraftTab';
import { TabList } from '@/components/ui/TabList'
import { RootEntityStore } from '@/store/common/types';
import { productStore, rootProductStore } from '@/store/rootStore'
import { IProductBase } from '@/types/dish/dish';
import { Product } from '@/types/product/product';
import { computed, makeAutoObservable, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import React from 'react'



const ProductTabs = ({ root = rootProductStore }) => {

    const { userStores, currentItemId, setCurrentId } = root


    return (
        <TabList isLoading={false}>
            <DraftTab isActive={currentItemId === -1} onClick={() => setCurrentId(-1)}>
                Создать
            </DraftTab>
            {userStores.map(product => (
                <Tab isActive={currentItemId === product.id} onClick={() => setCurrentId(product.id)}>
                    {product.name}
                </Tab>
            ))}
        </TabList>
    )
}

export default observer(ProductTabs)