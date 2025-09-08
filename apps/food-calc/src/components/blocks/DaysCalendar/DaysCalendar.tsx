import AttachedDay from '@/components/blocks/DaysCalendar/AttachedDay/AttachedDay'
import Calendar from '@/components/ui/Calendar/Calendar'
import DatePicker from '@/components/ui/DatePicker/DatePicker'
import { Typography } from '@/components/ui/Typography/Typography'
import { dayNames } from '@/constants'
import { rootDayStore2, uiStore } from '@/store/rootStore'
import { observer } from 'mobx-react-lite'
import React, { useState } from 'react'
import s from './DaysCalendar.module.css'
import Container from '@/components/ui/Container/Container'
import DayTabs from '@/components/blocks/Days/DayTabs/DayTabs'
import { TabList } from '@/components/ui/TabList'
import { Tab } from '@/components/ui/Tab'

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

    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: '2-digit', month: 'numeric', day: 'numeric' };
    const selectedDay = new Date(dayCalendarDate).toLocaleDateString('ru-RU', options)

    return (
        <section className={s.calendar}>
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
            <div className={s.attachDays}>
                <header className={s.attachDaysHeader}>
                    <Typography variant='caption' align='center'>прикрепить к календарю</Typography>
                    <Typography align='center'>{selectedDay}</Typography>
                </header>
                <Container>
                    <TabList isLoading={false}>
                        {userDayStores.map(({ id, name }) => (
                            <Tab
                                key={id}
                            // onClick={() => setCurrentDayId(id)}
                            // isActive={currentDayId === id}
                            >
                                {name}
                            </Tab>))}
                    </TabList>
                </Container>
            </div>
        </section>
    )
}

export default observer(DaysCalendar)