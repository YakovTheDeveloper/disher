import AddDishToDay from '@/components/blocks/AddDishToDay/AddDishToDay'

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
import DatePicker from '@/components/ui/Calendar/Calendar'
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
        id,
        addDishToCategory, isDishInCategory, currentCategoryId, setCurrentCategoryId, toggleDish,
        getDishCoefficient,
        updateDishCoefficient,
        date,
        setDate

    } = store

    const [dishAddCategory, setDishAddCategory] = useState<DayCategory | null>(null)

    const onDishAdd = (category: DayCategory) => {
        setCurrentCategoryId(category.id)
        setDishAddCategory(category)
    }

    console.log("date", date)

    return (
        <section className={s.day}>
            <div>
                <DatePicker date={date} setDate={setDate} />
            </div>
            <EditableText
                value={name}
                onChange={updateName}
                typographyProps={{ variant: 'h1' }}
            />
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
            <Actions store={store} />
            {/* <DayActions store={store}/> */}
        </section>
    )
}

export default observer(Day)