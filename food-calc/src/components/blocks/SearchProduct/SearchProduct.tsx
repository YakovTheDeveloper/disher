import React, { useCallback, useRef, useState } from 'react'
import SearchProductList from './SearchProductList/SearchProductList'
import { observer } from 'mobx-react-lite'
import s from './SearchProduct.module.css'
import Container from '@/components/ui/Container/Container'
import { rootDishStore } from '@/store/rootStore'
import useOutsideClick from '@/hooks/useOutsideClick'




const SearchProduct = () => {

    const [showProductList, setShowProductList] = useState(false)

    const [searchValue, setSearchValue] = useState('')
    const containerRef = useRef<HTMLDivElement>(null);

    // Hide product list when clicked outside
    useOutsideClick(containerRef, () => setShowProductList(false));

    const onChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setSearchValue(event.target.value);
            setShowProductList(!!event.target.value); // Show list only when there's a value
        },
        []
    );

    return (
        <Container className={s.container}>
            <div className={s.searchContainer} ref={containerRef}>
                <input className={s.search} value={searchValue} onChange={onChange} placeholder='Apples...' />
                <div className={s.listContainer}>
                    {showProductList && searchValue && <SearchProductList searchValue={searchValue} />}
                </div>
            </div>
        </Container >
    )
}

export default observer(SearchProduct)