import React, { useState, useEffect, useRef } from "react";
import useOutsideClick from "@/hooks/useOutsideClick";
import s from "./DatePicker.module.css";

import { Typography } from "@/components/ui/Typography/Typography";
import Calendar from "@/components/ui/Calendar/Calendar";
import { dayNames } from "@/constants";

type Props = {
    date: string;
    setDate: (date: string) => void;
};

const DatePicker: React.FC<Props> = ({ date, setDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(date ? new Date(date) : new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    useOutsideClick(containerRef, () => setIsOpen(false));

    useEffect(() => {
        if (date) {
            setCurrentMonth(new Date(date));
        }
    }, [date]);

    const toggleCalendar = () => setIsOpen(!isOpen);

    const handleDateClick = (selectedDate: Date) => {
        if (selectedDate.toISOString() === date) {
            setDate('');
        } else {
            setDate(selectedDate.toISOString());
        }
        setIsOpen(false);
    };

    const goToPreviousMonth = () => {
        const prevMonth = new Date(currentMonth);
        prevMonth.setMonth(currentMonth.getMonth() - 1);
        setCurrentMonth(prevMonth);
    };

    const goToNextMonth = () => {
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(currentMonth.getMonth() + 1);
        setCurrentMonth(nextMonth);
    };

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const label = date ? new Date(date).toLocaleDateString('ru-RU', options) : "Установить дату";

    return (
        <div ref={containerRef} className={s.container}>
            <span onClick={toggleCalendar} className={s.trigger}>
                {label}
            </span>
            <div className={s.calendarContainer}>
                {isOpen && (
                    <Calendar
                        currentMonth={currentMonth}
                        onDateSelect={handleDateClick}
                        selectedDate={date}
                        onPrevMonth={goToPreviousMonth}
                        onNextMonth={goToNextMonth}
                        dayNames={dayNames.ru}
                    />
                )}
            </div>

        </div>
    );
};

export default DatePicker;
