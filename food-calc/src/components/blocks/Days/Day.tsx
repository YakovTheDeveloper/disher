
import { observer } from 'mobx-react-lite'
import { Reorder } from 'framer-motion'
import s from './Day.module.css'
import Button from '@/components/ui/Button/Button'
import Actions from '@/components/blocks/common/Actions/Actions'
import EditableText from '@/components/ui/EditableText/EditableText'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import { DayStore2 } from '@/store/rootDayStore/dayStore2'
import DayCategories from '@/components/blocks/Days/DayCategories/DayCategories'
import { toJS } from 'mobx'
import { createContext } from 'react'
import { currentCalculationStore } from '@/store/rootStore'
import { DayCalculationContext } from '@/context/calculationContext'
import { Typography } from '@/components/ui/Typography/Typography'
import { NavLink } from 'react-router'

type Props = {
    store: DayStore2
    children: React.ReactNode
    actions: React.ReactNode
}

export type DishAddOptions = {
    categoryId: string
    categoryName: string
}

const Day = (props: Props) => {
    const { store, children, actions } = props
    const {
        categories,
        name,
        date,
        currentCategoryId,
        createNewCategory,
        updateName,
        updateDate,
        id
    } = store

    return (
        <section className={s.day}>
            <header className={s.header}>
                <EditableText
                    value={name}
                    onChange={updateName}
                    typographyProps={{ variant: 'h1' }}
                />
                <DatePicker date={date} setDate={updateDate} />
            </header>
            <div className={s.sub}>
                <Button onClick={() => createNewCategory()} variant='secondary'>
                    Создать категорию
                </Button>
                <NavLink
                    to='/calendar'
                >
                    <Typography color='green'>Календарь</Typography>
                </NavLink>
            </div>
            <div className={s.main}>
                <DayCalculationContext.Provider
                    value={{
                        updateCalculations: currentCalculationStore.updateDayCalculationsWithCurrentProducts
                    }}
                >
                    <DayCategories
                        store={store}
                    />
                </DayCalculationContext.Provider>

                <section>
                    {children}
                </section>
            </div>
            {actions}
        </section>
    )
}

export default observer(Day)
