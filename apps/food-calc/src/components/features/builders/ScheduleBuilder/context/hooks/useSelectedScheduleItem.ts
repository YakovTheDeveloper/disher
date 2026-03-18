import { useContext } from 'react';
import { SelectedScheduleFoodContext } from '../providers/SelectedScheduleItemProvider';

export const useSelectedScheduleFood = () => {
    const ctx = useContext(SelectedScheduleFoodContext);
    if (!ctx) throw new Error('useSelectedScheduleFood must be used within SelectedScheduleFoodProvider');
    return ctx;
};

export default useSelectedScheduleFood;