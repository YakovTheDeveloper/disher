import Tab, { TabProps } from '@/components/ui/Tab/Tab'
import React from 'react'
import s from './Tab.module.css'
import { Typography } from '@/components/ui/Typography/Typography'
import PlusIcon from "@/assets/icons/plus.svg";

type Props = TabProps

const DraftTab = (props: Props) => {
    return (
        <Tab
            {...props}
            containerClassName={s.draft}
            label={
                <Typography className={s.draftCaption} align='center' variant='caption'>
                    черновик
                </Typography>
            }>
            <PlusIcon style={{
                width: '14px',
                height: ' 14px'
            }} />
            {props.children}
        </Tab>
    )
}

export default DraftTab