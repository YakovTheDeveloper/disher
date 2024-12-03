import AddDishToDay from '@/components/blocks/Days/AddDishToDay/AddDishToDay'

import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import DayCategoryItem from '@/components/blocks/Days/DayCategory/DayCategory'
import { AnimatePresence, Reorder } from 'framer-motion'
import s from './Day.module.css'
import { CreateDayPayload, CreateDayResponse } from '@/types/api/day'
import Button from '@/components/ui/Button/Button'
import Actions from '@/components/blocks/common/Actions/Actions'
import EditableText from '@/components/ui/EditableText/EditableText'
import { DayStore } from '@/store/rootDayStore/dayStore'
import { DayCategory } from '@/types/day/day'
import DatePicker from '@/components/ui/DatePicker/DatePicker'

type Props = {
    store: DayStore
    addDay: (payload: CreateDayPayload) => Promise<CreateDayResponse>
}

export type DishAddOptions = {
    categoryId: string
    categoryName: string
}

const Day = (props: Props) => {
    const { store } = props
    const {
        updateName,
        changeCategoryName,
        removeDishFromCategory,
        removeCategory,
        addCategory,
        categories,
        name,
        currentCategoryId,
        setCurrentCategoryId,
        getDishCoefficient,
        updateDishCoefficient,
        date,
        setDate

    } = store

    const onDishAdd = (category: DayCategory) => {
        setCurrentCategoryId(category.id.toString())
    }

    return (
        <section className={s.day}>
            <div className={s.header}>
                <EditableText
                    value={name}
                    onChange={updateName}
                    typographyProps={{ variant: 'h1' }}
                />
                <DatePicker date={date} setDate={setDate} />
            </div>

            {/* <Typography variant='h1'>{name}</Typography> */}
            <Button onClick={addCategory} variant='secondary'>Создать категорию</Button>
            <div className={s.content}>
                <Reorder.Group
                    axis="y"
                    values={categories}
                    onReorder={(newOrder) => {
                        store.categories = newOrder;
                        store.syncPositions();
                    }}
                >
                    <AnimatePresence>
                        {categories.map((category, index) => (
                            <DayCategoryItem
                                key={category.id}
                                category={category}
                                index={index}
                                onDishAdd={onDishAdd}
                                currentCategoryId={currentCategoryId}
                                removeCategory={removeCategory}
                                removeDishFromCategory={removeDishFromCategory}
                                changeCategoryName={changeCategoryName}
                                getDishCoefficient={getDishCoefficient}
                                updateDishCoefficient={updateDishCoefficient}



                            />
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
                <section>
                    {<AddDishToDay day={store} />}
                </section>
            </div>
            <Actions store={store} />
            {/* <DayActions store={store}/> */}
        </section>
    )
}

export default observer(Day)