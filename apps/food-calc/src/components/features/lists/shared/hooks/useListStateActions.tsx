import { IAnyModelType, Instance } from 'mobx-state-tree';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { useNavigate } from 'react-router';
import { IDataStoreInstance } from '@/store/shared/DataStore';

type ExtractEntryType<IModel extends IAnyModelType> = Instance<IModel>;

interface ListActionsOptions<IModel extends IAnyModelType> {
  store: IDataStoreInstance<IModel>;
  navigateTo: string;
  createEntity: () => Instance<IModel>;
  filterKeys?: (keyof ExtractEntryType<IModel>)[]; // Типизируем ключи фильтрации
}

export const useListStateActions = <IModel extends IAnyModelType>({
  store,
  navigateTo,
  createEntity,
  filterKeys = ['name'],
}: ListActionsOptions<IModel>) => {
  const navigate = useNavigate();

  const onAdd = () => {
    const { id } = store.user.insert(createEntity());
    navigate(`${navigateTo}/${id}`);
  };

  const filter = useFilteringState([
    {
      tabName: 'мои',
      list: store.merged,
      filterKeys: filterKeys,
    },
  ] as const);

  return {
    filter,
    onAdd,
    navigate,
  };
};
