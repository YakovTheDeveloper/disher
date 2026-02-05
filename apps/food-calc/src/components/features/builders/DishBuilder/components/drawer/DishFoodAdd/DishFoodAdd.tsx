import { observer } from 'mobx-react-lite';
import { useDish, useSelectedDishItem } from '@/components/features/builders/DishBuilder/context';
import { useMemo } from 'react';
import { DishItem } from '@/domain/dish/Dish.model';
import { Tabs } from '@/components/ui/Tabs';
import { SearchFoodControls } from '@/components/features/builders/shared/components/SearchFood/SearchFoodControls';
import { FinishButton } from '@/components/features/builders/shared/atoms/FinishButton';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';
import { mstEnv } from '@/store/store';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import ModalLayout from '@/components/features/builders/shared/components/ModalLayout/ModalLayout';
import { WizardStep } from '@/components/features/builders/shared/components/WizardStep';
import { useEntityItemWizard } from '@/components/features/builders/shared/hooks/useEntityItemWizard';
import { domainStore } from '@/store/store';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance } from '@/store/RootStoreModel';
import {
  useFilteringStateV2,
  TabFilterConfig,
} from '@/components/features/shared/hooks/useFilteringStateV2';

type Props = {
  close: () => void;
  variant: 'add' | 'edit';
  defaultTab?: 'content' | 'quantity';
  foodStore?: FoodStoreInstance;
  dishStore?: DishStoreInstance;
};

const DishFoodAdd = observer(
  ({
    close,
    variant = 'add',
    defaultTab = 'content',
    foodStore = domainStore.foodStore,
    dishStore = domainStore.dishStore,
  }: Props) => {
    const dish = useDish();
    const currentChild = useSelectedDishItem();

    const baseTabs = [
      {
        value: 'content' as const,
        label: 'еда',
        alternativeLabel: currentChild.content?.name || '',
      },
      {
        value: 'quantity' as const,
        label: 'количество',
        alternativeLabel: `${currentChild.effectiveQuantity}`,
      },
    ];

    const { searchFocusState, currentTab, direction, setTab, handleFinish, handleNextStep } =
      useEntityItemWizard(variant, {
        defaultTab,
        baseTabs,
        onFinish: () => {
          if (variant === 'add') {
            dishStore.commitItemDraft(dish);
          }
          return currentChild.id;
        },
        onAfterFinish: close,
      });

    const filterKeys = ['name'] as const;

    const config = useMemo(
      () =>
        [
          {
            tabName: 'продукты',
            list: foodStore.merged,
            filterKeys,
          },
          {
            tabName: 'блюда',
            list: dishStore.merged,
            filterKeys,
          },
        ] as const,
      [foodStore.merged, dishStore.merged]
    );

    const filterState = useFilteringStateV2(config);

    return (
      <ModalLayout
        topRight={<FinishButton onClick={handleFinish} />}
        footer={
          <Tabs tabs={baseTabs} current={currentTab} setTab={setTab} variant="scheduleFoodAdd" />
        }
        showHeader={!searchFocusState.isSearchFocused}
      >
        <WizardStep stepKey={currentTab} direction={direction}>
          {currentTab === 'content' && (
            <SearchFood
              mode="products-only"
              currentChild={currentChild}
              onFinish={handleNextStep}
              searchState={filterState}
              onFocusChange={(focused) => searchFocusState.setSearchFocused(focused)}
            />
          )}
          {currentTab === 'quantity' && (
            <ContentEdit.Quantity content={currentChild.content} onFinish={handleNextStep} />
          )}
        </WizardStep>
      </ModalLayout>
    );
  }
);

export default DishFoodAdd;
