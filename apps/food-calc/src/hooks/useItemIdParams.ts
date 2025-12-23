import { useSearchParams } from 'react-router-dom';

export const useItemIdParam = (): string | null => {
    const [searchParams] = useSearchParams();
    return searchParams.get('item_id');
};
