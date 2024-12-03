import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import React, { useCallback } from 'react'
import s from './DayCategory.module.css'
import { Reorder, useDragControls, } from 'framer-motion';
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import EditableText from '@/components/ui/EditableText/EditableText'
import { DayCategory } from '@/types/day/day';
import DayCategoryDishItem from '@/components/blocks/Days/DayCategoryDishItem/DayCategoryDishItem';
import Slider from '@/components/ui/Slider/Slider';
import { Typography } from '@/components/ui/Typography/Typography';
import { debounce } from '@/utils/debounce';

type Props = {
    category: DayCategory
    onDishAdd: (category: DayCategory) => void
    index: number;
    removeCategory: (categoryId: number) => void; // Function to move category
    currentCategoryId: string
    removeDishFromCategory: any
    changeCategoryName: (categoryId: string, name: string) => void
    children: React.ReactNode
}


const DayCategoryItem: React.FC<Props> = (
    { changeCategoryName, currentCategoryId, children, category, onDishAdd, removeCategory, removeDishFromCategory, }
) => {
    const isActive = currentCategoryId === category.id.toString()
    const { id: categoryId } = category
    const onRemove = () => {
        removeCategory(categoryId)
    }
    const onDishRemove = (categoryId: string, dish: { id: string, name: string }) => {
        removeDishFromCategory(categoryId, dish)
    }
    const dragControls = useDragControls();





    return (
        <Reorder.Item
            as='li'
            value={category}
            key={category.id}
            className={clsx(s.dayCategory, isActive && s.active)}
            onClick={() => onDishAdd(category)}
            whileDrag={{ scale: 1.05, opacity: 0.8 }} // Feedback while dragging
            dragListener={false} // Disable default drag listener
            dragControls={dragControls} // Attach custom drag controls
        >
            <div
                className={s.dragHandle}
                onPointerDown={(event) => dragControls.start(event)} // Initiates drag
            >
                <span>::</span>
            </div>

            <button onClick={onRemove} className={clsx(s.removeCategoryButtonContainer, s.removeButton, s.hoverShow)}>x</button>

            <DayCategoryName
                name={category.name}
                isActive={isActive}
                changeCategoryName={changeCategoryName}
                categoryId={category.id}
            />

            {children}

            {/* <ul className={s.dishesList}>
                {category.dishes.map((dish) => {
                    const coefficient = getDishCoefficient(categoryId, dish.id);
                    return (
                        <DayCategoryDishItem key={dish.id} className={s.dish} dish={dish}>
                            <RemoveButton
                                className={clsx(s.hoverShow, s.removeButton)}
                                onClick={() => onDishRemove(category.id, dish)}
                                size='small'
                            />
                            <div className={s.sliderContainer}>
                                <Slider
                                    label={
                                        <Typography variant='caption'>
                                            {coefficient.toFixed(1)} * 100 гр. = {(coefficient * 100).toFixed(1)} гр.
                                        </Typography>
                                    }
                                    onChange={(value) => updateDishCoefficient(categoryId, dish.id, value)}
                                    value={coefficient}
                                />
                            </div>
                        </DayCategoryDishItem>
                    );
                })}
            </ul> */}
        </Reorder.Item>
    );
};

const DayCategoryName = (props) => {
    const { name, isActive, changeCategoryName, categoryId } = props

    const onChange = (value: string) => {
        changeCategoryName(categoryId, value)
    }

    return <EditableText onChange={onChange} value={name} typographyProps={{
        variant: 'body1'
    }} />
}

export default observer(DayCategoryItem)
// import { DayCategory } from '@/store/dayStore/rootDayStore'
// import clsx from 'clsx'
// import { observer } from 'mobx-react-lite'
// import React from 'react'
// import { DndProvider, useDrag, useDrop } from 'react-dnd'
// import { HTML5Backend } from 'react-dnd-html5-backend'
// import s from './DayCategory.module.css'

// type Props = {
//     category: DayCategory
//     onDishAdd: (category: DayCategory) => void
//     index: number;
//     moveCategory: (fromIndex: number, toIndex: number) => void; // Function to move category
// }

// const DayCategoryItem = (props: Props) => {
//     const { category, onDishAdd, index, moveCategory, removeCategory } = props

//     const [{ isDragging }, drag, preview] = useDrag({
//         type: 'CATEGORY',
//         item: { index },
//         collect: (monitor) => ({
//             isDragging: monitor.isDragging(),
//         }),
//     });

//     const [, drop] = useDrop({
//         accept: 'CATEGORY',
//         hover: (draggedItem: { index: number }) => {
//             if (draggedItem.index !== index) {
//                 moveCategory(draggedItem.index, index);
//                 draggedItem.index = index;
//             }
//         },
//         drop: (draggedItem: { index: number }) => {
//             // If dropped, we remove the item from its original place
//             if (draggedItem.index !== index) {
//                 removeCategory(draggedItem.index);
//             }
//         },
//     });


//     return (
//         <div ref={(node) => drag(drop(node))}
//             className={clsx([isDragging ? s.dragging : '', s.category])}
//         >
//             <p className={s.name}>{category.name}</p>
//             <button onClick={() => onDishAdd(category)} className={s.addButton}>+</button>
//             <ul>
//                 {category.dishes.map(({ id, position }) => (
//                     <li key={id}>
//                         {id}
//                     </li>
//                 ))}
//             </ul>
//         </div>
//     )
// }

// export default observer(DayCategoryItem)