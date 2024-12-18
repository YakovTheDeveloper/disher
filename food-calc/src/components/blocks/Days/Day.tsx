
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
        updateDate
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
                    <Reorder.Group
                        axis="y"
                        values={categories}
                        onReorder={(newOrder) => {
                            store.reorderCategories(newOrder)
                        }}
                    >
                        <DayCategories
                            categories={categories}
                            currentCategory={currentCategoryId}
                        />
                    </Reorder.Group>
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
// import AddDishToDay from '@/components/blocks/Days/AddDishToDay/AddDishToDay'

// import { observer } from 'mobx-react-lite'
// import { useState } from 'react'
// import DayCategoryItem from '@/components/blocks/Days/DayCategory/DayCategory'
// import { AnimatePresence, Reorder } from 'framer-motion'
// import s from './Day.module.css'
// import { CreateDayPayload, CreateDayResponse } from '@/types/api/day'
// import Button from '@/components/ui/Button/Button'
// import Actions from '@/components/blocks/common/Actions/Actions'
// import EditableText from '@/components/ui/EditableText/EditableText'
// import { DayStore } from '@/store/rootDayStore/dayStore'
// import { DayCategory, DayCategoryDish } from '@/types/day/day'
// import DatePicker from '@/components/ui/DatePicker/DatePicker'
// import DayCategoryDishList from '@/components/blocks/Days/DayCategory/DayCategoryDishList/DayCategoryDishList'
// import DayDishCoefficientSlider from '@/components/blocks/Days/DayCategory/DayCategoryDishList/DayDishCoefficientSlider/DayDishCoefficientSlider'

// type Props = {
//     store: DayStore
//     addDay: (payload: CreateDayPayload) => Promise<CreateDayResponse>
// }

// export type DishAddOptions = {
//     categoryId: string
//     categoryName: string
// }

// const Day = (props: Props) => {
//     const { store } = props
//     const {
//         updateName,
//         changeCategoryName,
//         removeDishFromCategory,
//         removeCategory,
//         addCategory,
//         categories,
//         name,
//         currentCategoryId,
//         setCurrentCategoryId,
//         getDishCoefficient,
//         updateDishCoefficient,
//         date,
//         setDate

//     } = store

//     const onDishAdd = (category: DayCategory) => {
//         setCurrentCategoryId(category.id.toString())
//     }

//     // const onDishRemove = (categoryId: string, dish: DayCategoryDish) => {
//     //     removeDishFromCategory(categoryId,d)
//     // }

//     return (
//         <section className={s.day}>
//             <div className={s.header}>
//                 <EditableText
//                     value={name}
//                     onChange={updateName}
//                     typographyProps={{ variant: 'h1' }}
//                 />
//                 <DatePicker date={date} setDate={setDate} />
//             </div>

//             {/* <Typography variant='h1'>{name}</Typography> */}
//             <Button onClick={addCategory} variant='secondary'>Создать категорию</Button>
//             <div className={s.main}>
//                 <Reorder.Group
//                     axis="y"
//                     values={categories}
//                     onReorder={(newOrder) => {
//                         store.categories = newOrder;
//                         store.syncPositions();
//                     }}
//                 >
//                     <AnimatePresence>
//                         {categories.map((category, index) => (
//                             <DayCategoryItem
//                                 key={category.id}
//                                 category={category}
//                                 index={index}
//                                 onDishAdd={onDishAdd}
//                                 currentCategoryId={currentCategoryId}
//                                 removeCategory={removeCategory}
//                                 removeDishFromCategory={removeDishFromCategory}
//                                 changeCategoryName={changeCategoryName}
//                                 renderDragHandle={true} // Pass down this prop to allow the item to render a drag handle
//                             >

//                                 <DayCategoryDishList
//                                     category={category}
//                                     getDishCoefficient={getDishCoefficient}
//                                     updateDishCoefficient={updateDishCoefficient}
//                                     removeDishFromCategory={removeDishFromCategory}
//                                     dishSliderRender={(dishId: number) => (
//                                         <DayDishCoefficientSlider
//                                             day={store}
//                                             dishId={dishId}
//                                             coefficient={getDishCoefficient(category.id, dishId)}
//                                         />
//                                     )}


//                                 >


//                                 </DayCategoryDishList>
//                             </DayCategoryItem>
//                         ))}
//                     </AnimatePresence>
//                 </Reorder.Group>
//                 <section>
//                     {<AddDishToDay day={store} />}
//                 </section>
//             </div>
//             <Actions store={store} />
//             {/* <DayActions store={store}/> */}
//         </section>
//     )
// }

// export default observer(Day)