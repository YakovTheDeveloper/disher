export type DaySchedule = {
    id: number;
    date: string;
    items: DayScheduleItem[];
};

export type DayScheduleItem = {
    id: number;
    foodId: number;
    foodName: string;
    quantity: number;
    time: string;
};
