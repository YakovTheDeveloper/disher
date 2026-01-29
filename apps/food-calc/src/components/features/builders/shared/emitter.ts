import mitt from 'mitt';

// Define the event types
type NutrientsEvents = {
    RECALCULATE_NUTRIENTS: void;
};

type ScheduleUIEvents = {
    OPEN_COPY_SCHEDULE_MODAL: void;
    CREATE_DISH: void;
    SCROLL_NAVIGATION: number; // scrollTop value
};

// Create mitt emitters
export const NutrientsEventEmitter = mitt<NutrientsEvents>();
export const ScheduleUIEventEmitter = mitt<ScheduleUIEvents>();
