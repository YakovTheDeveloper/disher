import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { useNavigate } from 'react-router';

interface ListActionsOptions<T extends { id: string }> {
  items: T[];
  navigateTo: string;
  createEntity: () => Promise<string> | string;
  filterKeys?: (keyof T)[];
}

export const useListStateActions = <T extends { id: string }>({
  items,
  navigateTo,
  createEntity,
  filterKeys = ['name' as keyof T],
}: ListActionsOptions<T>) => {
  const navigate = useNavigate();

  const onAdd = async () => {
    const id = await createEntity();
    navigate(`${navigateTo}/${id}`);
  };

  const filter = useFilteringState([
    {
      tabName: 'мои',
      list: items,
      filterKeys: filterKeys,
    },
  ] as const);

  return {
    filter,
    onAdd,
    navigate,
  };
};
