import AddDishToDay from '@/components/blocks/AddDishToDay/AddDishToDay'
import { DayCategory, DayStore } from '@/store/dayStore/rootDayStore'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DayCategoryItem from '@/components/blocks/Days/DayCategory/DayCategory'
import { AnimatePresence, Reorder } from 'framer-motion'
import s from './Day.module.css'
import { CreateDayPayload, CreateDayResponse } from '@/types/api/day'
import Button from '@/components/ui/Button/Button'
import { Typography } from '@/components/ui/Typography/Typography'
type Props = {
    store: DayStore
    createDay: (payload: CreateDayPayload) => Promise<CreateDayResponse>
}

export type DishAddOptions = {
    categoryId: string
    categoryName: string
}

const Day = (props: Props) => {
    const { store } = props
    const { changeCategoryName, removeDishFromCategory, onSave, moveCategory, removeCategory, addCategory, categories, name, id, addDishToCategory, isDishInCategory, currentCategoryId, setCurrentCategoryId, toggleDish } = store

    const [dishAddCategory, setDishAddCategory] = useState<DayCategory | null>(null)

    const onDishAdd = (category: DayCategory) => {
        setCurrentCategoryId(category.id)
        setDishAddCategory(category)
    }

    return (
        <section className={s.day}>
            <Typography variant='h1'>{name}</Typography>
            <Button onClick={addCategory} variant='primary'>Создать категорию</Button>
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


                            />
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
                <section>
                    {dishAddCategory &&
                        <AddDishToDay
                            addDishToCategory={addDishToCategory}
                            dishAddCategory={dishAddCategory}
                            isDishInCategory={isDishInCategory}
                            currentCategoryId={currentCategoryId}
                            toggleDish={toggleDish}
                        />}
                </section>
            </div>
            <Button onClick={onSave} variant='primary'>Сохранить</Button>
        </section>
    )
}

export default observer(Day)