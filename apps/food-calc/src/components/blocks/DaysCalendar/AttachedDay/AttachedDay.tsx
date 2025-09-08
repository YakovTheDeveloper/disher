import Button from '@/components/ui/Button/Button'
import { Typography } from '@/components/ui/Typography/Typography'
import React from 'react'
import { useNavigate } from 'react-router-dom'

type Props = {
    userDayName: string
    onUserDayClick: () => void
}

const AttachedDay = ({ userDayName, onUserDayClick }: Props) => {
    const navigate = useNavigate();

    const handleNavigation = () => {
        onUserDayClick()
        navigate('/days'); // Navigates to /days
    }

    return (
        <Button variant='tertiary' onClick={handleNavigation}>
            <Typography>
                {userDayName}
            </Typography>
        </Button>
    )
}

export default AttachedDay;
