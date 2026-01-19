import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { RouterLinks } from '@/router';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { ActionsHeader } from '@/components/features/builders/food/shared/components/ActionsHeader';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { FilterButton } from '@/components/features/builders/food/shared/atoms/button/FilterButton';
import { CommonListItem } from '@/components/features/builders/food/shared/ui/CommonListItem';
import clsx from 'clsx';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { productFactory } from '@/domain/product/Food.factory';
import { ScalableHeaderNameInput } from '@/components/features/lists/shared/ScalableHeaderNameInput';
import { useListStateActions } from '@/components/features/lists/shared/hooks/useListStateActions';
import styles from './ProductList.module.scss';

type Props = {
  modalStore?: ModalStoreInstance;
  foodStore?: FoodStoreInstance;
};

const ProductList = ({
  modalStore = domainStore.globalUiStore.modalStore,
  foodStore = domainStore.foodStore,
}: Props) => {
  const { onAdd, navigate, filter } = useListStateActions({
    store: foodStore,
    basePath: RouterLinks.UserProduct,
    createDraft: () =>
      productFactory.createNewLocal({
        name: 'Новый продукт',
        description: '',
        createdByUser: true,
      }),
    filterKeys: ['name', 'description'],
  });

  return (
    <Screen
      header={<ScalableHeaderNameInput state={filter} />}
      actions={
        <ActionsHeader
          left={
            <button
              onClick={() => {
                modalStore.openConfirmationModal(ModalType.CONFIRMATION_REMOVE_DISHES);
              }}
            >
              удалить
            </button>
          }
        />
      }
      bottom={<Button.Add onClick={onAdd} />}
      title={<ScreenLabel variant="screenHeader">Продукты</ScreenLabel>}
      backgroundColor="gray"
    >
      <Spacer variant="screen-header-offset" />
      <FilterButton />
      <ItemsList>
        {filter.filteredList.map((item) => (
          <>
            <CommonListItem
              key={item.id}
              id={item.id}
              sync={{ status: 'none', lastSync: '' }}
              variant={2}
              innerClassName={clsx([styles.innerListItem])}
            >
              <p onClick={() => navigate(`${RouterLinks.UserProduct}/${item.id}`)}>
                {item.name || 'без имени'}
              </p>
            </CommonListItem>
            <button className={clsx([styles.selectButton])}></button>
          </>
        ))}
      </ItemsList>
    </Screen>
  );
};

export default observer(ProductList);
