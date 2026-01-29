import { useContext } from 'react';
import { SelectedEventItemContext } from '../providers/SelectedEventItemProvider';

export const useSelectedEventItem = () => {
    const ctx = useContext(SelectedEventItemContext);
    if (!ctx) throw new Error('useSelectedEventItem must be used within SelectedEventItemProvider');
    return ctx;
};

export default useSelectedEventItem;