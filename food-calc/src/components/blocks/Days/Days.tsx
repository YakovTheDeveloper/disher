import Day from '@/components/blocks/Days/Day'
import { rootDayStore } from '@/store/rootStore'
import React from 'react'

const Days = () => {

    const { draftDayStore } = rootDayStore

    return (
        <Day store={draftDayStore}></Day>
    )
}

export default Days