import { DayCategory } from '@/store/dayStore/rootDayStore'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import s from './DayCategory.module.css'
import { motion, Reorder, } from 'framer-motion';
import { toJS } from 'mobx'
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton'
import EditableText from '@/components/ui/EditableText/EditableText'

type Props = {
    category: DayCategory
    onDishAdd: (category: DayCategory) => void
    index: number;
    removeCategory: (categoryId: string) => void; // Function to move category
    currentCategoryId: string
    removeDishFromCategory: any
    changeCategoryName: (categoryId: string, name: string) => void
}


const DayCategoryItem: React.FC<Props> = ({ changeCategoryName, currentCategoryId, category, onDishAdd, removeCategory, removeDishFromCategory }) => {
    const isActive = currentCategoryId === category.id
    const { id: categoryId } = category
    const onRemove = () => {
        removeCategory(categoryId)
    }
    const onDishRemove = (categoryId: string, dish: { id: string, name: string }) => {
        removeDishFromCategory(categoryId, dish)
    }

    return (
        <Reorder.Item
            as='li'
            value={category}
            key={category.id}
            className={clsx(s.category, isActive && s.active)}
            onClick={() => onDishAdd(category)}
            whileDrag={{ scale: 1.05, opacity: 0.8 }}  // Feedback while dragging
        >
            <button onClick={onRemove} className={clsx(s.removeCategoryButtonContainer, s.removeButton, s.hoverShow)}>x</button>
            <DayCategoryName name={category.name} isActive={isActive} changeCategoryName={changeCategoryName} categoryId={category.id} />
            <ul>
                {category.dishes.map(({ id, name }) => (
                    <li key={id} className={s.dish}>
                        <span>{name}</span>
                        <RemoveButton className={clsx(s.hoverShow, s.removeButton)} onClick={() => onDishRemove(category.id, { id, name })} />
                    </li>
                ))}
            </ul>
        </Reorder.Item>
    );
};

const DayCategoryName = (props) => {
    const { name, isActive, changeCategoryName, categoryId } = props

    console.log("name", name)

    const onChange = (value: string) => {
        changeCategoryName(categoryId, value)
    }

    return <EditableText onChange={onChange} value={name} typographyProps={{
        variant: 'body1'
    }} />




    if (isActive) return (
        <input className={s.name} defaultValue={name} maxLength={30} onChange={onChange} />
    )
    return (
        <p className={s.name}>{name}</p>
    )
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