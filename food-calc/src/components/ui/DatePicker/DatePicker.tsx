import useOutsideClick from "@/hooks/useOutsideClick";
import React, { useState, useEffect, useRef } from "react";
import s from "./DatePicker.module.css";
import RemoveButton from "@/components/ui/RemoveButton/RemoveButton";
import { Typography } from "@/components/ui/Typography/Typography";

// Utility function to generate an array of dates for the current month
const getDaysInMonth = (date: Date): Date[] => {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const days: Date[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
};

type Props = {
    date: string; // ISO string for the currently selected date
    setDate: (date: string) => void; // Callback to update the selected date
};

const DatePicker: React.FC<Props> = ({ date, setDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date | null>(
        date ? new Date(date) : new Date()
    );

    const containerRef = useRef<HTMLDivElement>(null);

    // Hide calendar when clicked outside
    useOutsideClick(containerRef, () => setIsOpen(false));

    // When `date` prop changes, update the `currentMonth`
    useEffect(() => {
        if (date) {
            setCurrentMonth(new Date(date));
        }
    }, [date]);

    // Toggles the visibility of the calendar
    const toggleCalendar = () => setIsOpen(!isOpen);

    // Handles date selection
    const handleDateClick = (selectedDate: Date) => {
        if (selectedDate.toISOString() === date) {
            setDate('')
            setIsOpen(false); // Close the calendar
            return
        }
        setDate(selectedDate.toISOString());
        setIsOpen(false); // Close the calendar
    };

    // Navigate to the previous month
    const goToPreviousMonth = () => {
        if (currentMonth) {
            const prevMonth = new Date(currentMonth);
            prevMonth.setMonth(currentMonth.getMonth() - 1);
            setCurrentMonth(prevMonth);
        }
    };

    // Navigate to the next month
    const goToNextMonth = () => {
        if (currentMonth) {
            const nextMonth = new Date(currentMonth);
            nextMonth.setMonth(currentMonth.getMonth() + 1);
            setCurrentMonth(nextMonth);
        }
    };

    // Generate days for the current month or fallback to current date
    const daysInMonth = currentMonth ? getDaysInMonth(currentMonth) : [];

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };
    const label = date ? new Date(date).toLocaleDateString('ru-RU', options) : "Установить дату"

    return (
        <div ref={containerRef} className={s.container}>
            <span onClick={toggleCalendar} className={s.trigger}>
                {label}
            </span>
            {isOpen && (
                <div className={s.calendar}>
                    <div className={s.header}>
                        <button onClick={goToPreviousMonth} disabled={!currentMonth}>
                            &lt;
                        </button>
                        <span>
                            {currentMonth
                                ? currentMonth.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                })
                                : "No Month Selected"}
                        </span>
                        <button onClick={goToNextMonth} disabled={!currentMonth}>
                            &gt;
                        </button>
                    </div>
                    <div className={s.dayNames}>
                        {dayNames.ru.map((day) => (
                            <Typography key={day} variant="caption" align="center">{day}</Typography>
                        ))}
                    </div>
                    <div className={s.grid}>
                        {daysInMonth.map((day) => (
                            <div
                                key={day.toISOString()}
                                className={`${s.day} ${day.toISOString() === date ? s.selectedDay : ""
                                    }`}
                                onClick={() => handleDateClick(day)}
                            >
                                {day.getDate()}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

const dayNames = {
    ru: ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
}


export default DatePicker;
