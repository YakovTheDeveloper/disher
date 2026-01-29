import { useContext } from 'react';
import { DraftScheduleItemContext } from '../providers/DraftScheduleItemProvider';

export const useDraftEventScheduleItem = () => {
    const ctx = useContext(DraftScheduleItemContext);
    if (!ctx) throw new Error('useDraftScheduleItem must be used within DraftScheduleItemProvider');
    return ctx.eventDraft;
};

export const useDraftFoodScheduleItem = () => {
    const ctx = useContext(DraftScheduleItemContext);
    if (!ctx) throw new Error('useDraftScheduleItem must be used within DraftScheduleItemProvider');
    return ctx.foodDraft;
};