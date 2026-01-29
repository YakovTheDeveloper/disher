import { useContext } from 'react';
import { SelectedScheduleItemContext } from '../providers/SelectedScheduleItemProvider';

export const useSelectedScheduleItem = () => {
    const ctx = useContext(SelectedScheduleItemContext);
    if (!ctx) throw new Error('useSelectedScheduleItem must be used within SelectedScheduleItemProvider');
    return ctx;
};

export default useSelectedScheduleItem;