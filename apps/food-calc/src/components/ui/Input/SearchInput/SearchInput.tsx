import Input, { InputProps } from '@/components/ui/Input/Input'
import React from 'react'
import SearchIcon from "@/assets/icons/search.svg";
import clsx from 'clsx';
import s from './SearchInput.module.css'

const SearchInput = ({ className = '', wrapperClassName = '', ...inputProps }: InputProps) => {



    return (
        <Input
            {...inputProps}
            className={clsx([className, s.searchInput])}
            wrapperClassName={clsx([wrapperClassName, s.searchWrapper])}
            before={<SearchIcon />}
        />

    )
}

export default SearchInput