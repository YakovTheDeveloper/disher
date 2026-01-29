import { observer, useLocalObservable } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useMemo, useEffect, useRef, useCallback } from 'react';
import { SearchFood } from '@/components/features/builders/ScheduleBuilder/components/FoodAdd';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import { domainStore } from '@/store/store';
import ModalLayout from '@/components/features/builders/shared/components/ModalLayout/ModalLayout';
import { WizardStep } from '@/components/features/builders/shared/components/WizardStep';
import { FinishButton } from '@/components/features/builders/shared/atoms/FinishButton';
import { SearchFoodControls } from '@/components/features/builders/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import {
  useDraftFoodScheduleItem,
  useSchedule,
  useSelectedScheduleItem,
} from '@/components/features/builders/ScheduleBuilder/context';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance } from '@/store/types';
import { TimeNow } from '@/components/features/builders/shared/ContentEdit/Time/TimeNow';
import WeatherBackground from '@/components/features/WeatherBackground/WeatherBacground';
import { DrawerStoreInstance, ProductDrawers } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import RoundedPlusIcon from '@/assets/icons/rounded-plus-icon.svg';
import { useEntityItemWizard } from '@/components/features/builders/shared/hooks/useEntityItemWizard';
type Props = {
  close: () => void;
  foodStore?: FoodStoreInstance;
  dishStore?: DishStoreInstance;
  variant: 'add' | 'edit';
  defaultTab?: string;
  drawerStore?: DrawerStoreInstance;
};

const ScheduleFoodAdd = observer(
  ({
    close,
    foodStore = domainStore.foodStore,
    dishStore = domainStore.dishStore,
    variant,
    defaultTab,
    drawerStore = domainStore.globalUiStore.drawerStore,
  }: Props) => {
    const schedule = useSchedule();
    const hook = variant === 'add' ? useDraftFoodScheduleItem : useSelectedScheduleItem;
    const currentChild = hook();

    const timeState = useLocalObservable(() => ({
      localTime: currentChild.time,
      handleTimeUpdate(newTime: string) {
        this.localTime = newTime;
        currentChild.updateTime(newTime);
      },
    }));

    // useEffect(() => {
    //   runInAction(() => (timeState.localTime = currentChild.time));
    // }, [currentChild.time, timeState]);

    const baseTabs = [
      { value: 'time' as const, label: 'время', alternativeLabel: currentChild.time },
      {
        value: 'foodSelect' as const,
        label: 'еда',
        alternativeLabel: currentChild.content?.name || 'не установлено',
      },
      {
        value: 'quantity' as const,
        label: 'количество',
        alternativeLabel: `${currentChild.quantity}`,
      },
    ];

    const { searchFocusState, currentTab, direction, setTab, handleFinish, handleNextStep } =
      useEntityItemWizard(variant, {
        defaultTab: defaultTab as 'info' | 'time' | 'foodSelect' | 'quantity' | undefined,
        baseTabs,
        enableHashSync: true,
        onFinish: () => {
          if (variant === 'add') {
            return schedule.addDraftToFoods();
          }
          return currentChild.id;
        },
        onAfterFinish: () => close(),
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

    const filterState = useFilteringState(config);

    const onHeaderButtonClick = () => {
      drawerStore.open({
        type: ProductDrawers.Add,
      });
    };

    return (
      <ModalLayout
        headerCenter={
          currentTab === 'foodSelect' && (
            <button onClick={onHeaderButtonClick} style={{ fontSize: '1.5rem' }}>
              <RoundedPlusIcon />
            </button>
          )
        }
        topRight={<FinishButton onClick={handleFinish} />}
        footer={
          <Tabs
            tabs={
              variant === 'edit'
                ? [{ value: 'info', label: 'info', alternativeLabel: '' }, ...baseTabs]
                : baseTabs
            }
            current={currentTab}
            setTab={setTab}
            variant="scheduleFoodAdd"
            onFinish={handleFinish}
          />
        }
        background={<WeatherBackground time={currentChild.time} weatherType="cloudy" />}
        showHeader={!searchFocusState.isSearchFocused}
      >
        <WizardStep stepKey={currentTab} direction={direction} helpButton>
          {currentTab === 'info' && <div>инфа</div>}
          {currentTab === 'time' && (
            <ContentEdit.Time item={currentChild} timeState={timeState} onFinish={handleNextStep} />
          )}
          {currentTab === 'foodSelect' && (
            <SearchFood
              scheduleChild={currentChild}
              onFinish={handleNextStep}
              searchState={filterState}
              onFocusChange={(focused) => searchFocusState.setSearchFocused(focused)}
            >
              <SearchFoodControls searchState={filterState} isVisible={true} />
            </SearchFood>
          )}
          {currentTab === 'quantity' && (
            <ContentEdit.Quantity item={currentChild} onFinish={handleNextStep} />
          )}
        </WizardStep>
      </ModalLayout>
    );
  }
);

SearchFoodControls.motionKey = 'food';
TimeNow.motionKey = 'time';

export default ScheduleFoodAdd;
