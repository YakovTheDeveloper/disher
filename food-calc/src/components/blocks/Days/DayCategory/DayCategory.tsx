import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import React, { useContext } from 'react'
import s from './DayCategory.module.css'
import { Reorder, useDragControls, } from 'framer-motion';
import EditableText from '@/components/ui/EditableText/EditableText'
import { DayCategory } from '@/types/day/day';
import { DayCategoryStore } from '@/store/rootDayStore/dayCategoryStore/dayCategoryStore';
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton';
import { DayCalculationContext } from '@/context/calculationContext';
import { rootDayStore2 } from '@/store/rootStore';
import RemoveTooltip from '@/components/blocks/common/RemoveTooltip/RemoveTooltip';
import { Tooltip } from '@/components/ui/Tooltip/Tooltip';

const ReorderItemProps = {
    as: 'li' as const,
    whileDrag: { scale: 1.05, opacity: 0.8 },
    dragListener: false
}

type Props = {
    category: DayCategoryStore
    removeCategory: () => void
    index: number;
    children: React.ReactNode
    isActive: boolean
}


const DayCategoryItem: React.FC<Props> = (
    { category, isActive, children }
) => {
    const { updateCalculations } = useContext(DayCalculationContext)
    const dragControls = useDragControls();

    const { name, updateName, remove, setAsCurrent } = category



    const onDayCategoryRemove = () => {
        remove()
        updateCalculations()
    }

    console.log("category", category)

    // const removeButtonVisible

    return (
        <Reorder.Item
            className={clsx(s.dayCategory, isActive && s.active)}
            value={category}
            onClick={setAsCurrent}
            dragControls={dragControls}
            {...ReorderItemProps}
        >
            <div
                className={s.dragHandle}
                onPointerDown={(event) => dragControls.start(event)}
            >
                <span>||</span>
            </div>
            <header className={s.header}>
                <EditableText
                    onChange={updateName}
                    value={name}
                    typographyProps={{
                        variant: 'h2'
                    }}
                />
                {children}
            </header>
            <Tooltip placement='left-start' isClick>
                <RemoveTooltip
                    onConfirm={() => onDayCategoryRemove()}
                >
                    <RemoveButton
                        className={clsx(s.removeButton)}
                        color='gray'
                        size='small'
                    />
                </RemoveTooltip>
            </Tooltip>

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