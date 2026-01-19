import { IAnyModelType, Instance } from 'mobx-state-tree';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { useNavigate } from 'react-router';
import { IDataStoreInstance } from '@/store/shared/DataStore';

type ExtractEntryType<IModel extends IAnyModelType> = Instance<IModel>;

interface ListActionsOptions<IModel extends IAnyModelType> {
  store: IDataStoreInstance<IModel>;
  basePath: string;
  createDraft: () => Instance<IModel>;
  filterKeys?: (keyof ExtractEntryType<IModel>)[]; // Типизируем ключи фильтрации
}

export const useListStateActions = <IModel extends IAnyModelType>({
  store,
  basePath,
  createDraft,
  filterKeys = ['name'],
}: ListActionsOptions<IModel>) => {
  const navigate = useNavigate();

  const onAdd = () => {
    const { id } = store.user.insert(createDraft());
    navigate(`${basePath}/${id}`);
  };

  const filter = useFilteringState([
    {
      tabName: 'мои',
      list: store.merged,
      filterKeys: filterKeys,
    },
  ]);

  return {
    filter,
    onAdd,
    navigate,
  };
};
