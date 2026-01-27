/**
 * Parse time string in 'HH:MM' format to numeric hour (0-23)
 * @param timeStr - Time string in format 'HH:MM'
 * @returns Hour as number (0-23), or null if invalid
 */
export const parseTimeToHour = (timeStr: string): number | null => {
    if (!timeStr || typeof timeStr !== 'string') return null;

    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hour = parseInt(match[1], 10);
    if (hour < 0 || hour > 23) return null;

    return hour;
};

/**
 * Determine atmospheric time period based on hour
 * @param hour - Hour (0-23)
 * @returns Time period: 'night' | 'earlyMorning' | 'morning' | 'day' | 'evening'
 */
export const getTimePeriod = (hour: number): 'night' | 'earlyMorning' | 'morning' | 'day' | 'evening' => {
    if (hour >= 22 || hour < 4) return 'night';           // 22:00 - 03:59
    if (hour >= 4 && hour < 7) return 'earlyMorning';     // 04:00 - 06:59
    if (hour >= 7 && hour < 10) return 'morning';         // 07:00 - 09:59
    if (hour >= 10 && hour < 18) return 'day';            // 10:00 - 17:59
    if (hour >= 18 && hour < 21) return 'evening';        // 18:00 - 20:59
    return 'night'; // Fallback
};

/**
 * Get transition progress between time periods (0-1)
 * Used for smooth gradient transitions
 * @param hour - Hour (0-23)
 * @returns Progress value 0-1
 */
export const getTransitionProgress = (hour: number): number => {
    const minute = 0; // Could be extended to accept minutes
    const hourDecimal = hour + minute / 60;

    // Smooth transitions at boundaries
    const period = getTimePeriod(hour);

    switch (period) {
        case 'night':
            // 22:00 - 03:59
            return hourDecimal >= 22 ? (hourDecimal - 22) / 6 : (hourDecimal + 24 - 22) / 6;
        case 'earlyMorning':
            // 04:00 - 06:59
            return (hourDecimal - 4) / 3;
        case 'morning':
            // 07:00 - 09:59
            return (hourDecimal - 7) / 3;
        case 'day':
            // 10:00 - 17:59
            return (hourDecimal - 10) / 8;
        case 'evening':
            // 18:00 - 20:59
            return (hourDecimal - 18) / 3;
        default:
            return 0;
    }
};

/**
 * Get current time as 'HH:MM' string
 */
export const getCurrentTimeString = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};
