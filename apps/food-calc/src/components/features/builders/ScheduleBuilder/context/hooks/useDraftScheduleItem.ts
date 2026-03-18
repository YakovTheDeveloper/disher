import { useContext } from 'react';
import { DraftScheduleFoodContext } from '../providers/DraftScheduleItemProvider';

export const useDraftEventScheduleFood = () => {
    const ctx = useContext(DraftScheduleFoodContext);
    if (!ctx) throw new Error('useDraftScheduleFood must be used within DraftScheduleFoodProvider');
    return ctx.eventDraft;
};

export const useDraftFoodScheduleFood = () => {
    const ctx = useContext(DraftScheduleFoodContext);
    if (!ctx) throw new Error('useDraftScheduleFood must be used within DraftScheduleFoodProvider');
    return ctx.foodDraft;
};