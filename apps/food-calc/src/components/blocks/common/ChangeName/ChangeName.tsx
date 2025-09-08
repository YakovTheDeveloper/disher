import EditableText from '@/components/ui/EditableText/EditableText'
import Input from '@/components/ui/Input/Input'
import { Typography } from '@/components/ui/Typography/Typography'
import React from 'react'
import s from './ChangeName.module.css'
import { observer } from 'mobx-react-lite'

type Props = {
    isDraft: boolean
    updateName: (value: string) => void
    value: string
    key: string
    placeholder: string
}

const ChangeName = ({ isDraft, updateName, value, key, placeholder }: Props) => {
    return isDraft
        ? <Input
            size='medium'
            placeholder={placeholder}
            typographyVariant="h2"
            wrapperClassName={s.dishNameInput}
            value={value}
            onChange={(e) => updateName(e.target.value)}
        // label={<Typography variant="caption" align="center">Название для вашего блюда</Typography>}
        />
        : <EditableText
            key={key}
            placeholder={placeholder}
            typographyProps={{
                variant: 'h2',
                underline: true,
                color: 'green-2'
            }}
            value={value}
            onChange={updateName}
        />
}

export default observer(ChangeName)