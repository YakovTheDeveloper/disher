import React from "react";
import s from "./Calendar.module.css";
import { Typography } from "@/components/ui/Typography/Typography";

type CalendarProps = {
    currentMonth: Date;
    onDateSelect: (date: Date) => void;
    selectedDate: string | null;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    dayNames: string[];
    renderDayCellContent?: (dayDate: Date) => JSX.Element;
};

// Helper function to get the days of a given month and the surrounding months if needed to fill the calendar grid
const getDaysInMonth = (date: Date): Date[] => {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days: Date[] = [];

    // Get the previous month's last days to fill in the first week
    const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const prevMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);
    const prevMonthDays = prevMonthEnd.getDate();

    // Calculate the start day of the week of the current month (0 for Sunday, 1 for Monday, etc.)
    const startDayOfWeek = startDate.getDay(); // Sunday is 0, Monday is 1, etc.
    const adjustedStartDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Adjust to Monday start

    // Add previous month's days before the current month's first day
    for (let i = adjustedStartDayOfWeek; i >= 0; i--) {
        days.push(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonthDays - i));
    }

    // Add the current month's days
    let currentDate = startDate;
    while (currentDate <= endDate) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get the next month's days to fill the last row
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    const nextMonthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const endDayOfWeek = endDate.getDay(); // Calculate the day of the week for the last day of the current month

    // Add next month's days to fill the last row (if needed)
    const remainingDays = 7 - ((endDayOfWeek + 1) % 7); // Calculate how many more days we need to fill the row
    for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i));
    }

    return days;
};

// Main Calendar component
const Calendar: React.FC<CalendarProps> = ({
    currentMonth,
    onDateSelect,
    selectedDate,
    onPrevMonth,
    onNextMonth,
    dayNames,
    renderDayCellContent
}) => {
    const daysInMonth = getDaysInMonth(currentMonth);

    // Split the days into weeks (arrays of 7 days)
    const weeks = [];
    for (let i = 0; i < daysInMonth.length; i += 7) {
        weeks.push(daysInMonth.slice(i, i + 7));
    }

    return (
        <div className={s.calendar}>
            <div className={s.header}>
                <button onClick={onPrevMonth}>&lt;</button>
                <Typography variant="body1">
                    {currentMonth.toLocaleDateString("ru-Ru", { year: "numeric", month: "long" })}
                </Typography>
                <button onClick={onNextMonth}>&gt;</button>
            </div>
            <div className={s.dayNames}>
                {dayNames.map((day) => (
                    <Typography key={day} variant="caption" align="center">
                        {day}
                    </Typography>
                ))}
            </div>
            <div className={s.grid}>
                {weeks.map((week, index) => (
                    <div key={index} className={s.week}>
                        {week.map((day) => (
                            <div
                                key={day.toISOString()}
                                className={`${s.day} ${day.getMonth() !== currentMonth.getMonth() ? s.otherMonthDay : ""} ${day.toISOString() === selectedDate ? s.selectedDay : ""}`}
                                onClick={() => onDateSelect(day)}
                            >
                                {day.getDate()}
                                {renderDayCellContent?.(day)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;
