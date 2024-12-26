import React, { useCallback, useRef, useState } from 'react'
import SearchProductList from './SearchProductList/SearchProductList'
import { observer } from 'mobx-react-lite'
import s from './SearchProduct.module.css'
import Container from '@/components/ui/Container/Container'
import { rootDishStore } from '@/store/rootStore'
import useOutsideClick from '@/hooks/useOutsideClick'
import Input from '@/components/ui/Input/Input'
import SearchIcon from "@/assets/icons/search.svg";
import { Typography } from '@/components/ui/Typography/Typography'
import clsx from 'clsx'




const SearchProduct = () => {

    const [showProductList, setShowProductList] = useState(false)

    const [searchValue, setSearchValue] = useState('')
    const containerRef = useRef<HTMLDivElement>(null);

    // Hide product list when clicked outside
    useOutsideClick(containerRef, () => {
        setShowProductList(false)
    });

    const onChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setSearchValue(event.target.value);
            setShowProductList(!!event.target.value); // Show list only when there's a value
        },
        []
    );

    const onInputClick = () => {
        if (!searchValue) return
        setShowProductList(true)
    }

    return (
        <div className={s.container}>
            <Typography variant='caption' align='center'>Поиск продуктов</Typography>
            <div className={s.searchContainer} ref={containerRef}>
                <Input
                    wrapperClassName={clsx([s.searchWrapper, showProductList && s.borderRadius])}
                    className={s.searchInput}
                    value={searchValue}
                    onChange={onChange}
                    onClick={onInputClick}
                    placeholder='Например, гречка'
                    before={<SearchIcon />}
                />

                <div className={s.listContainer}>
                    {showProductList && searchValue &&
                        <SearchProductList
                            searchValue={searchValue}
                            hideList={() => setShowProductList(false)}
                        />
                    }
                </div>
            </div>
        </div >
    )
}

export default observer(SearchProduct)