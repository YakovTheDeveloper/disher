import { observer } from 'mobx-react-lite';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import { DishListItem } from '@/components/features/builders/food/DishBuilder/ui/DishListItem';
import { Instance } from 'mobx-state-tree';
import { Dish } from '@/domain/dish/Dish';
import { useDishModals } from '@/components/features/builders/food/DishBuilder/modalContext';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { Swipeable } from '@/components/features/builders/food/shared/ui/layout/Swipeable';
import { TotalNutrients } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';
import { ActionsHeader } from '@/components/features/builders/food/shared/components/ActionsHeader';
import { DishFoodSelectionActions } from '@/components/features/builders/food/DishBuilder/components/header-actions/DishFoodSelectionActions';
import { RouterLinks } from '@/router';
import { MotionValue } from 'framer-motion';
import { Scalable } from '@/components/ui/Scalable';
import { useNavigate } from 'react-router';
import { DishDrawers, DrawerStoreInstance } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';

export const Modals = {
  Food: 'food',
  Quantity: 'quantity',
  Nutrients: 'nutrients',
} as const;

export type ModalsType = (typeof Modals)[keyof typeof Modals];

type Props = {
  init: Instance<typeof Dish>;
  onFinish: (data: Instance<typeof Dish>) => Promise<void>;
  modalStore?: ModalStoreInstance;
  drawerStore?: DrawerStoreInstance;
};

const DishBuilder = ({
  init,
  onFinish,
  modalStore = domainStore.globalUiStore.modalStore,
  drawerStore = domainStore.globalUiStore.drawerStore,
}: Props) => {
  const dishes = init;
  const navigate = useNavigate();

  const onFoodsOpen = () => {
    drawerStore.open({
      type: DishDrawers.FoodAdd,
    });
  };

  return (
    <Swipeable defaultIndex={1} pageNames={['nutrients', 'food']}>
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
                    modalStore.openConfirmationModal(ModalType.CONFIRMATION_REMOVE_DISH_ITEMS);
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
              Еда
            </ScreenLabel>
          }
          header={(scrollYProgress: MotionValue<number>) => (
            <Scalable scrollYProgress={scrollYProgress}>
              {/* <EditableText
                  value={userFood?.name || ''}
                  onChange={(val) => userFood?.changeName(val)}
                  className={styles.textInput}
                /> */}
            </Scalable>
          )}
          bottom={<Button.Add onClick={onFoodsOpen} />}
        >
          <ItemsList>
            {dishes.items.map((content) => {
              return <DishListItem key={content.id} controller={init} content={content} />;
            })}
          </ItemsList>
        </Screen>,
      ]}
    </Swipeable>
  );
};

export default observer(DishBuilder);
