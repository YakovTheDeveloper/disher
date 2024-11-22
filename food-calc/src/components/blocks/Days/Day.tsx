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
type Props = {
    store: DayStore
}

export type DishAddOptions = {
    categoryId: string
    categoryName: string
}

const Day = (props: Props) => {
    const { store } = props
    const { addCategory, categories, name, id, addDishToCategory, isDishInCategory, currentCategoryId, setCurrentCategoryId } = store

    console.log(toJS(categories).map(a => a.dishes))
    console.log(toJS(categories))

    const [dishAddCategory, setDishAddCategory] = useState<DayCategory | null>(null)

    const onDishAdd = (category: DayCategory) => {
        setCurrentCategoryId(category.id)
        setDishAddCategory(category)
    }

    const { moveCategory, removeCategory, updateCategoryPositions, generatePayload } = store

    const onSave = () => {
        const res = toJS(generatePayload())
        console.log(toJS(res.dayContent))
    }

    // const moveCategory = (fromIndex: number, toIndex: number) => {
    //     store.updateCategoryPositions(fromIndex, toIndex);
    // };

    // const removeCategory = (index: number) => {
    //     const updatedCategories = [...categories];
    //     updatedCategories.splice(index, 1);
    //     updateCategories(updatedCategories);
    // };



    return (
        <section className={s.day}>
            <h2>{name}</h2>
            <button onClick={addCategory}>Создать категорию</button>
            <div className={s.content}>
                <Reorder.Group
                    axis="y"  // Restrict movement to the y-axis (vertical)
                    values={categories}
                    onReorder={(newOrder) => {
                        // Update the store with the new order
                        store.categories = newOrder;
                        store.syncPositions(); // Sync positions after reordering
                    }}
                >
                    <AnimatePresence>

                        {categories.map((category, index) => (
                            <DayCategoryItem
                                key={category.id}
                                category={category}
                                index={index}
                                onDishAdd={onDishAdd}
                                moveCategory={moveCategory}
                                removeCategory={removeCategory}
                                currentCategoryId={currentCategoryId}
                            />
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
                {dishAddCategory &&
                    <AddDishToDay
                        addDishToCategory={addDishToCategory}
                        dishAddCategory={dishAddCategory}
                        isDishInCategory={isDishInCategory}
                        moveCategory={moveCategory}
                        removeCategory={removeCategory}
                        currentCategoryId={currentCategoryId}
                    />}
                <button onClick={onSave}>Сохранить</button>
            </div>
        </section>
    )
}

export default observer(Day)