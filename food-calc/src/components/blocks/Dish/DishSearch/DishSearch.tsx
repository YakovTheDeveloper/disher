import SearchInput from '@/components/ui/Input/SearchInput/SearchInput'
import { Tooltip, TooltipContent, TooltipInner, TooltipTrigger } from '@/components/ui/Tooltip/Tooltip'
import { DishUiStore } from '@/store/uiStore/dishUiStore/dishUiStore'
import { debounce } from '@/utils/debounce'
import { observer } from 'mobx-react-lite'
import React, { useCallback } from 'react'

type Props = {
    uiStore: DishUiStore
    getAll: (search: string, usePaginationParams: boolean) => void
    onChange: () => void
}
const DishSearch = ({ getAll, uiStore, onChange }: Props) => {

    const { setSearch } = uiStore

    const onSearch = (e) => {
        onChange()
        setSearch('dishPage', e.target.value)
        debouncedSearch()
    }

    const debouncedSearch = useCallback(debounce(() => {
        getAll(uiStore.searchBarDishPage, false)
    }, 500), [])

    return (
        <SearchInput value={uiStore.searchBarDishPage} onChange={onSearch} placeholder='Название блюда' size='small' />
    )
}

export default observer(DishSearch)
