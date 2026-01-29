import { observer } from 'mobx-react-lite';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { DishListItem } from '@/components/features/builders/DishBuilder/ui/DishListItem';
import { Instance } from 'mobx-state-tree';
import { Dish } from '@/domain/dish/Dish';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { TotalNutrients } from '@/components/features/builders/shared/ContentInfo/TotalNutrients';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';
import { ActionsHeader } from '@/components/features/builders/shared/components/ActionsHeader';
import { DishFoodSelectionActions } from '@/components/features/builders/DishBuilder/components/header-actions/DishFoodSelectionActions';
import { RouterLinks } from '@/router';
import { MotionValue } from 'framer-motion';
import { Scalable } from '@/components/ui/Scalable';
import { useNavigate } from 'react-router';
import SwipeableV2 from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableV2';

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

  const onFoodsOpen = () => {
    modalStore.openModal(ModalType.DISH_CREATE);
  };

  return (
    <SwipeableV2 defaultIndex={1} pageNames={['nutrients', 'food']}>
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
          bottom={<Buttons.Add onClick={onFoodsOpen} />}
        >
          <ItemsList>
            {dishes.items.map((content) => {
              return <DishListItem key={content.id} controller={init} content={content} />;
            })}
          </ItemsList>
        </Screen>,
      ]}
    </SwipeableV2>
  );
};

export default observer(DishBuilder);
