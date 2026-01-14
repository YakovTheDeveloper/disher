import { useMemo } from 'react';

import { observer } from 'mobx-react-lite';
import style from './DishBuilder.module.scss';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import { Heading } from '@/components/features/builders/food/DishBuilder/ui/Heading';
import { BuilderUIStore } from '@/components/features/builders/food/shared/BuilderUIStore';
import { Actions } from '@/components/features/builders/food/shared/ui/Actions';
import { DishListItem } from '@/components/features/builders/food/DishBuilder/ui/DishListItem';
import { Nutrients } from '@/components/features/builders/food/shared/ContentInfo/Nutrients';
import { Instance } from 'mobx-state-tree';
import { Dish } from '@/domain/dish/Dish';
import { useDishModals } from '@/components/features/builders/food/DishBuilder/modalContext';
import { FoodAdd } from '@/components/features/builders/food/DishBuilder/components/FoodAdd';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import ModalRoot from '@/components/features/builders/food/shared/ModalRoot/ModalRoot';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { Swipeable } from '@/components/features/builders/food/shared/ui/layout/Swipeable';
import { TotalNutrients } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';
import { ActionsHeader } from '@/components/features/builders/food/shared/components/ActionsHeader';
import { DishFoodSelectionActions } from '@/components/features/builders/food/DishBuilder/components/header-actions/DishFoodSelectionActions';

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
};

const DishBuilder = ({
  init,
  onFinish,
  modalStore = domainStore.globalUiStore.modalStore,
}: Props) => {
  const dishes = init;
  const modals = useDishModals();
  const options = useMemo(() => new BuilderUIStore([0, 1]), []);

  const onFoodsOpen = () => {
    modals.set(Modals.Food);
  };

  const onMoreOptions = () => {
    options.toggle();
  };

  const onSync = () => {
    onFinish(dishes);
  };

  return (
    <div className={style.container}>
      <Swipeable index={options.currentPage} defaultIndex={1} onIndexChange={onPageChange}>
        {[
          <Screen key={1} title={<ScreenLabel variant="screenHeader">Нутриенты</ScreenLabel>}>
            <TotalNutrients store={schedule} countable={dishes} />
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
                  navigate(RouterLinks.Dishes + `?from_date=${date}`);
                }}
              >
                Еда
              </ScreenLabel>
            }
            header={(scrollYProgress: MotionValue<number>) => (
              <Navigation scrollYProgress={scrollYProgress}></Navigation>
            )}
            bottom={<Button.Add onClick={onFoodsOpen} />}
          >
            <ItemsList>
              {dishes.items.map((content) => {
                return (
                  <DishListItem
                    key={content.id}
                    controller={init}
                    content={content}
                    options={options}
                  />
                );
              })}
            </ItemsList>
          </Screen>,
        ]}
      </Swipeable>

      {/* <Heading store={dishes} /> */}

      {/* <ModalRoot modals={modals}>
        {{
          [Modals.Food]: <FoodAdd store={dishes} />,
          [Modals.Quantity]: <ContentEdit.Quantity store={dishes} onFinish={modals.close} />,
          [Modals.Nutrients]: <Nutrients getCurrentFood={() => {}} />,
        }}
      </ModalRoot> */}
    </div>
  );
};

export default observer(DishBuilder);
