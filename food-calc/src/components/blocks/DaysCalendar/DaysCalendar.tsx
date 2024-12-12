import AttachedDay from '@/components/blocks/DaysCalendar/AttachedDay/AttachedDay'
import Calendar from '@/components/ui/Calendar/Calendar'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import { Typography } from '@/components/ui/Typography/Typography'
import { dayNames } from '@/constants'
import { rootDayStore2, uiStore } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import React, { useState } from 'react'

const DaysCalendar = () => {

    const { dayCalendarDate, setDayCalendarDate } = uiStore

    const { userDayStores } = rootDayStore2

    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const onPrevMonth = () => {
        const prevMonth = new Date(currentMonth);
        prevMonth.setMonth(currentMonth.getMonth() - 1);
        setCurrentMonth(prevMonth);
    };

    const onNextMonth = () => {
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(currentMonth.getMonth() + 1);
        setCurrentMonth(nextMonth);
    };


    return (
        <Calendar
            currentMonth={currentMonth}
            onNextMonth={onNextMonth}
            onPrevMonth={onPrevMonth}
            selectedDate={dayCalendarDate}
            onDateSelect={(date) => setDayCalendarDate(date.toISOString())}
            dayNames={dayNames.ru}
            renderDayCellContent={(dayDate) => {
                const userDay = userDayStores.find(({ date }) => {
                    return date === dayDate.toISOString()
                })
                if (!userDay) return null
                return (
                    <AttachedDay
                        userDayName={userDay.name}
                        onUserDayClick={() => rootDayStore2.setCurrentDayId(userDay.id)}
                    />
                )
            }

            }
        />
    )
}

export default observer(DaysCalendar)