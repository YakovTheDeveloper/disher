import React, { useState } from 'react'
import SearchProductList from './SearchProductList/SearchProductList'



const SearchProduct = () => {

    const [searchValue, setSearchValue] = useState('')

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value)
    }



    return (
        <div>
            <input value={searchValue} onChange={onChange} placeholder='Apples...' />
            {searchValue && <SearchProductList searchValue={searchValue}/>}
        </div >
    )
}

export default SearchProduct