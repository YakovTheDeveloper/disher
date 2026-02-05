import { observer } from 'mobx-react-lite';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { Instance } from 'mobx-state-tree';
import { Dish } from '@/domain/dish/Dish.model';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { TotalNutrients } from '@/components/features/builders/shared/ContentInfo/TotalNutrients';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { domainStore } from '@/store/store';
import { ActionsHeader } from '@/components/features/builders/shared/components/ActionsHeader';
import { DishFoodSelectionActions } from '@/components/features/builders/DishBuilder/components/header-actions/DishFoodSelectionActions';
import { RouterLinks } from '@/router';
import { MotionValue } from 'framer-motion';
import { Scalable } from '@/components/ui/Scalable';
import { useNavigate } from 'react-router';
import SwipeableV2 from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableV2';
import { HeaderInputName } from '@/components/features/builders/shared/components/HeaderInputName';
import { useOverlay } from '@/store/GlobalUiStore/OverlayStore';
import { clearSessionStorage } from '@/infrastructure/storage/sessionStorage';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import styles from './DishBuilder.module.scss';

export const Modals = {
  Food: 'food',
  Quantity: 'quantity',
  Nutrients: 'nutrients',
} as const;

export type ModalsType = (typeof Modals)[keyof typeof Modals];

type Props = {
  init: Instance<typeof Dish>;
  modalStore?: ModalStoreInstance;
};

const DishBuilder = ({ init, modalStore = domainStore.globalUiStore.modalStore }: Props) => {
  const dishes = init;
  const navigate = useNavigate();

  const { openFormDishAdd, openFormDishEdit } = useOverlay();

  return (
    <SwipeableV2 pageNames={['nutrients', 'food']}>
      {[
        <Screen key={1} title={<ScreenLabel variant="screenHeader">Нутриенты</ScreenLabel>}>
          <TotalNutrients store={dishes} countable={dishes} />
        </Screen>,

        <Screen
          actions={
            <ActionsHeader
              left={
                <button
                  onClick={() => {
                    domainStore.globalUiStore.drawerStore.open({
                      type: DrawerTypesV2.Confirmation.RemoveDishItems,
                    });
                  }}
                >
                  удалить
                </button>
              }
            >
              <DishFoodSelectionActions />
            </ActionsHeader>
          }
          key={2}
          title={
            <ScreenLabel
              variant="screenHeader"
              onClick={() => {
                navigate(RouterLinks.ScheduleBuilder);
              }}
            >
              {init.name}
            </ScreenLabel>
          }
          header={<HeaderInputName entity={init} asInput />}
          bottom={<Buttons.Add onClick={openFormDishAdd} />}
        >
          <ItemsList offsetTop>
            {dishes.items.map((item) => {
              const content = item.content;
              const id = item.id;
              const onFoodClick = () => {
                clearSessionStorage(`tabs:${location.pathname}`);
                openFormDishEdit(id, 'content');
              };

              const onQuantityClick = () => {
                clearSessionStorage(`tabs:${location.pathname}`);
                openFormDishEdit(id, 'quantity');
              };

              return (
                <CommonListItem
                  key={id}
                  id={id}
                  className={styles.group}
                  innerClassName={styles.dishFoodListItem}
                >
                  <FoodName onClick={onFoodClick} content={content} />
                  <Quantity
                    id={id}
                    onClick={onQuantityClick}
                    hide={false}
                    unit="г"
                    content={content}
                  />
                </CommonListItem>
              );
            })}
          </ItemsList>
        </Screen>,
      ]}
    </SwipeableV2>
  );
};

export default observer(DishBuilder);
