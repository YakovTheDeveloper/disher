import { DayCategory } from '@/store/dayStore/rootDayStore'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import s from './DayCategory.module.css'
import { motion, Reorder, } from 'framer-motion';
import { toJS } from 'mobx'

type Props = {
    category: DayCategory
    onDishAdd: (category: DayCategory) => void
    index: number;
    moveCategory: (fromIndex: number, toIndex: number) => void; // Function to move category
    currentCategoryId: string
}


const DayCategoryItem: React.FC<Props> = ({ currentCategoryId, category, onDishAdd, index, moveCategory, removeCategory }) => {
    const isActive = currentCategoryId === category.id
    console.log("category",toJS(category))
    return (
        <Reorder.Item
            as='li'
            value={category} // Use the category id as the unique key for each item
            key={category.id}
            className={clsx(s.category, isActive && s.active)}

            whileDrag={{ scale: 1.05, opacity: 0.8 }}  // Feedback while dragging
        >
            <p className={s.name}>{category.name}</p>
            <button onClick={() => onDishAdd(category)} className={s.addButton}>+</button>
            <ul>
                {category.dishes.map(({ id, name }) => (
                    <li key={id}>{name}</li>
                ))}
            </ul>
        </Reorder.Item>
    );
};

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