import React from 'react'
import second from 'first'
import s from './RichNutrientProductSkeleton.module.css'
import originalStyles from '../RichNutrientProduct.module.css'
import Skeleton from '@/components/ui/Skeleton/Skeleton'
import { Typography } from '@/components/ui/Typography/Typography'
import { LoadingStateStore } from '@/store/common/LoadingStateStore'
import { observer } from 'mobx-react-lite'

type Props = {
    loadingState: LoadingStateStore
    unitName: string,
    nutrientName: string
}

const RichNutrientProductSkeleton = ({ unitName = 'mg', loadingState, nutrientName }: Props) => {

    const loading = loadingState.getLoading('getOne', nutrientName)
    if (!loading) return null

    return (
        <div className={s.richNutrientSkeletonContainer}>
            {[1, 2, 3].map(() => (
                <div className={s.inner}>
                    <div className={originalStyles.richProduct}>
                        <Typography variant='caption'>{unitName}</Typography>
                        <Skeleton />
                        <Skeleton />
                        <span></span>
                        <Skeleton />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default observer(RichNutrientProductSkeleton)