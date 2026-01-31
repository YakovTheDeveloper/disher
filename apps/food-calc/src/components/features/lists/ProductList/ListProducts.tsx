import { observer } from 'mobx-react-lite';
import { domainStore } from '@/store/store';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { RouterLinks } from '@/router';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { ActionsHeader } from '@/components/features/builders/shared/components/ActionsHeader';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { Button } from '@/components/ui/atoms/Button';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import clsx from 'clsx';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { productFactory } from '@/domain/product/Food.factory';
import { ScalableHeaderNameInput } from '@/components/features/shared/components/ScalableHeaderNameInput';
import { useListStateActions } from '@/components/features/shared/hooks/useListStateActions';
import styles from './ListProducts.module.scss';

type Props = {
  foodStore?: FoodStoreInstance;
};

const ListProducts = ({ foodStore = domainStore.foodStore }: Props) => {
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
                domainStore.globalUiStore.drawerStore.open({
                  type: DrawerTypesV2.Confirmation.RemoveUserFood,
                });
              }}
            >
              удалить
            </button>
          }
        />
      }
      bottom={<Buttons.Add onClick={onAdd} />}
      title={<ScreenLabel variant="screenHeader">Продукты</ScreenLabel>}
      backgroundColor="gray"
    >
      <Spacer variant="screen-header-offset" />
      <Button variant="filter">Фильтр</Button>
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

export default observer(ListProducts);
