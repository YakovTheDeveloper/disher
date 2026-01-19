import { observer } from 'mobx-react-lite';
import { IAnyModelType, Instance } from 'mobx-state-tree';

import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { ActionsHeader } from '@/components/features/builders/food/shared/components/ActionsHeader';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { useNavigate } from 'react-router';
import { ConfirmationModals, ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { DrawerStoreInstance } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import styles from './CommonEntityListFacade.module.scss';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { Scalable } from '@/components/ui/Scalable';
import SearchInput from '@/components/ui/Input/SearchInput/SearchInput';

import { Spacer } from '@/components/ui/atoms/Spacer';
import { FilterButton } from '@/components/features/builders/food/shared/atoms/button/FilterButton';
import { MergedDataStoreEntity, MergedDataStoreEntityUserOnly } from '@/store/shared/DataStore';
import { StoreEntityFactory } from '@/store/types/factory';
import { CommonListItem } from '@/components/features/builders/food/shared/ui/CommonListItem';
import clsx from 'clsx';

type Props<BaseModel extends IAnyModelType, UserModel extends IAnyModelType> = {
  title: string;
  navigatePath: keyof typeof RouterLinks;
  filterKeys: string[];
  store: MergedDataStoreEntity<BaseModel, UserModel>;
  modalStore?: ModalStoreInstance;
  drawerStore?: DrawerStoreInstance;
  renderItem?: (
    item: Instance<BaseModel | UserModel>,
    navigate: (path: string) => void
  ) => React.ReactNode;
  buttonAdd: React.ReactNode;
  confirmationDeleteModalType: ConfirmationModals;
};

const CommonEntityListFacade = <BaseModel extends IAnyModelType, UserModel extends IAnyModelType>({
  title,
  navigatePath,
  filterKeys,
  store,
  buttonAdd,
  modalStore = domainStore.globalUiStore.modalStore,
  drawerStore = domainStore.globalUiStore.drawerStore,
  renderItem,
  confirmationDeleteModalType,
}: Props<BaseModel, UserModel>) => {
  const navigate = useNavigate();

  const state = useFilteringState([
    {
      tabName: 'мои',
      list: store.merged,
      filterKeys,
    },
  ]);

  const onRemove = () => {
    modalStore.openConfirmationModal(confirmationDeleteModalType);
  };

  return (
    <Screen
      header={(scrollYProgress: any) => (
        <Scalable scrollYProgress={scrollYProgress} className={styles.header}>
          <SearchInput value={state.filterText} onChange={(e) => state.setSearch(e.target.value)} />
        </Scalable>
      )}
      actions={<ActionsHeader left={<button onClick={onRemove}>удалить</button>} />}
      bottom={buttonAdd}
      title={<ScreenLabel variant="screenHeader"> {title} </ScreenLabel>}
      backgroundColor="gray"
    >
      <Spacer variant="screen-header-offset" />
      <FilterButton />
      <ItemsList>
        {state.localFiltered.map((item) => {
          if (renderItem) return renderItem(item, navigate);
          return (
            <CommonListItem
              key={item.id}
              id={item.id}
              sync={{ status: 'none' }}
              variant={2}
              innerClassName={clsx([styles.innerListItem])}
            >
              <p onClick={() => navigate(`${RouterLinks[navigatePath]}/${item.id}`)}>
                {item.name || 'без имени'}
              </p>
            </CommonListItem>
          );
        })}
      </ItemsList>
    </Screen>
  );
};

export default observer(CommonEntityListFacade);
