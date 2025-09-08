import Button from '@/components/ui/Button/Button'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipInner } from '@/components/ui/Tooltip/Tooltip'
import { defaultNutrientsV2 } from '@/store/nutrientStore/data'
import React from 'react'
import s from './NutrientsFilter.module.css'
import SelectableInput from '@/components/ui/Button/SelectableInput/SelectableInput'
import { uiStore } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import { Typography } from '@/components/ui/Typography/Typography'
import { toJS } from 'mobx'
import EyeIcon from "@/assets/icons/eye.svg";

const NutrientsFilter = ({ store = uiStore }) => {

    const { nutrients: { nutrientGroupsVisibility, toggleShowNutrientGroup, nutrientsVisibility, toggleNutrient } } = store


    console.log("state", toJS(nutrientGroupsVisibility))

    return (
        <Tooltip isClick placement='right-start' >
            <TooltipTrigger>
                <Button className={s.filterButton} variant='ghost'>
                    <EyeIcon />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <TooltipInner size='medium' className={s.container}>
                    <div className={s.filterGroupContainer}>
                        <Typography variant='h2'>Настройка видимости нутриентов</Typography>
                        <Typography variant='caption'>Категории</Typography>
                        <ul className={s.filterList}>
                            {defaultNutrientsV2.map(({ name, displayName }) => {
                                console.log("state", name, toJS(nutrientGroupsVisibility))
                                return (
                                    <li className={s.filterListItem}>
                                        <SelectableInput
                                            id={name}
                                            name={name}
                                            isChecked={nutrientGroupsVisibility[name]}
                                            onChange={(id) => {
                                                toggleShowNutrientGroup(id)
                                            }}
                                            type='checkbox'
                                            label={displayName}
                                        />
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                    <div className={s.singleNutrientFilter}>
                        {defaultNutrientsV2.map(group => (
                            <div className={s.filterGroupContainer}>
                                <Typography variant='caption'>{group.displayName}</Typography>
                                <ul className={s.filterList}>
                                    {group.content.map(({ name, displayNameRu }) => {
                                        return (
                                            <li className={s.filterListItem}>
                                                <SelectableInput
                                                    id={name}
                                                    name={name}
                                                    isChecked={nutrientsVisibility[name]}
                                                    onChange={(id) => { toggleNutrient(id) }}
                                                    type='checkbox'
                                                    label={displayNameRu}
                                                />
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                </TooltipInner>
            </TooltipContent>

        </Tooltip>
    )
}

export default observer(NutrientsFilter)