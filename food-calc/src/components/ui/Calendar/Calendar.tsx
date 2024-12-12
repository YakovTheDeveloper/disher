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
    renderDayCellContent?: (dayDate: Date) => JSX.Element
};

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

    return (
        <div className={s.calendar}>
            <div className={s.header}>
                <button onClick={onPrevMonth}>&lt;</button>
                <Typography variant="body1">
                    {currentMonth.toLocaleDateString("en-US", { year: "numeric", month: "long" })}
                </Typography>
                <button onClick={onNextMonth}>&gt;</button>
            </div>
            <div className={s.dayNames}>
                {dayNames.map((day) => (
                    <Typography key={day} variant="caption" align="center">{day}</Typography>
                ))}
            </div>
            <div className={s.grid}>
                {daysInMonth.map((day) => (
                    <div
                        key={day.toISOString()}
                        className={`${s.day} ${day.toISOString() === selectedDate ? s.selectedDay : ""}`}
                        onClick={() => onDateSelect(day)}
                    >
                        {day.getDate()}
                        {renderDayCellContent?.(day)}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Calendar;
