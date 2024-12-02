import useOutsideClick from "@/hooks/useOutsideClick";
import React, { useState, useEffect, useRef } from "react";

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

    // Hide product list when clicked outside
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
        setDate(selectedDate.toISOString())
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

    return (
        <div ref={containerRef}>
            <span onClick={toggleCalendar} style={{ cursor: "pointer", padding: "5px" }}>
                {date ? new Date(date).toLocaleDateString() : "Select Date"}
            </span>

            {isOpen && (
                <div style={calendarStyles}>
                    <div style={headerStyles}>
                        <button onClick={goToPreviousMonth} disabled={!currentMonth}>&lt;</button>
                        <span>
                            {currentMonth
                                ? currentMonth.toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                })
                                : "No Month Selected"}
                        </span>
                        <button onClick={goToNextMonth} disabled={!currentMonth}>&gt;</button>
                    </div>
                    <div style={gridStyles}>
                        {daysInMonth.map((day) => (
                            <div
                                key={day.toISOString()}
                                style={{
                                    ...dayStyles,
                                    backgroundColor: day.toISOString() === date ? "#ADD8E6" : "",
                                    cursor: "pointer",
                                }}
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

// Styles
const calendarStyles: React.CSSProperties = {
    position: "absolute",
    backgroundColor: "white",
    border: "1px solid #ddd",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    zIndex: 10,
    padding: "10px",
};

const headerStyles: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
};

const gridStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "5px",
};

const dayStyles: React.CSSProperties = {
    textAlign: "center",
    padding: "10px",
    borderRadius: "50%",
    cursor: "pointer",
};

export default DatePicker;
