import { Typography } from '@/components/ui/Typography/Typography'
import React from 'react'

type Props = {
    isShow: boolean
}

const EmptyListMessage = ({ isShow }: Props) => {
    if (!isShow) return null
    return (
        <div>
            <Typography variant="caption">Список пуст</Typography>
            <p>Можно добавить продукты, воспользовавшись <Typography variant="underline">поиском</Typography>
            </p>
        </div>
    )
}

export default EmptyListMessage