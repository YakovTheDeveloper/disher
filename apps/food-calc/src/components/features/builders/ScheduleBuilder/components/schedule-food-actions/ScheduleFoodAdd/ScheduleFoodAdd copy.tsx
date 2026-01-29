import { observer, useLocalObservable } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useMemo, useEffect } from 'react';
import { SearchFood } from '@/components/features/builders/ScheduleBuilder/components/FoodAdd';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import { domainStore } from '@/store/store';
import ModalLayout from '@/components/features/builders/shared/components/ModalLayout/ModalLayout';
import { WizardStep } from '@/components/features/builders/shared/components/WizardStep';
import { useTabs } from '@/components/features/builders/shared/hooks/useTabs';
import { FinishButton } from '@/components/features/builders/shared/atoms/FinishButton';
import { SearchFoodControls } from '@/components/features/builders/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import {
  useDraftScheduleItem,
  useSchedule,
  useSelectedScheduleItem,
} from '@/components/features/builders/ScheduleBuilder/context';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance } from '@/store/types';
import { TimeNow } from '@/components/features/builders/shared/ContentEdit/Time/TimeNow';
import WeatherBackground from '@/components/features/WeatherBackground/WeatherBacground';
import styles from './ScheduleFoodAdd.module.scss';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import {
  DrawerStoreInstance,
  ProductDrawers,
  ScheduleDrawers,
} from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import RoundedPlusIcon from '@/assets/icons/rounded-plus-icon.svg';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { emitter, highlightListItem } from '@/infrastructure/emitter/emitter';
type Props = {
  close: () => void;
  foodStore?: FoodStoreInstance;
  dishStore?: DishStoreInstance;
  variant: 'add' | 'edit';
  defaultTab?: string;
  modalStore: ModalStoreInstance;
  drawerStore: DrawerStoreInstance;
};

const ScheduleFoodAdd = observer(
  ({
    close,
    foodStore = domainStore.foodStore,
    dishStore = domainStore.dishStore,
    variant,
    defaultTab,
    modalStore = domainStore.globalUiStore.modalStore,
    drawerStore = domainStore.globalUiStore.drawerStore,
  }: Props) => {
    const schedule = useSchedule();
    const hook = variant === 'add' ? useDraftScheduleItem : useSelectedScheduleItem;
    const currentChild = hook();

    const timeState = useLocalObservable(() => ({
      localTime: currentChild.time,
      handleTimeUpdate(newTime: string) {
        this.localTime = newTime;
        currentChild.updateTime(newTime);
      },
    }));

    useEffect(() => {
      runInAction(() => (timeState.localTime = currentChild.time));
    }, [currentChild.time, timeState]);

    const onFinish = () => {
      if (variant === 'add') {
        schedule.addDraftToFoods();
      }
      close();
      highlightListItem(currentChild.id);
    };

    const tabs = [
      ...(variant === 'edit'
        ? [
            {
              value: 'info',
              label: 'info',
              alternativeLabel: '',
            },
          ]
        : []),
      { value: 'time', label: 'время', alternativeLabel: currentChild.time },
      {
        value: 'foodSelect',
        label: 'еда',
        alternativeLabel: currentChild.content?.name || 'не установлено',
      },
      { value: 'quantity', label: 'количество', alternativeLabel: `${currentChild.quantity}` },
    ];

    const { currentTab, goNext, setTab, direction } = useTabs(tabs, defaultTab);

    const onStepFinishHandler = () => {
      if (variant === 'add') {
        setTimeout(() => goNext(), 100);
        return;
      }
      close();
      highlightListItem(currentChild.id);
    };
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

    const searchFocusState = useLocalObservable(() => ({
      isSearchFocused: false,
      setSearchFocused(value: boolean) {
        this.isSearchFocused = value;
      },
    }));

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
        topRight={<FinishButton onClick={onFinish} />}
        footer={
          <Tabs
            tabs={tabs}
            current={currentTab}
            setTab={setTab}
            variant="scheduleFoodAdd"
            onFinish={onFinish}
          />
        }
        background={<WeatherBackground time={currentChild.time} weatherType="cloudy" />}
        showHeader={!searchFocusState.isSearchFocused}
      >
        <WizardStep stepKey={currentTab} direction={direction} helpButton>
          {currentTab === 'info' && (
            <ContentEdit.Time
              item={currentChild}
              timeState={timeState}
              onFinish={onStepFinishHandler}
            />
          )}
          {currentTab === 'time' && (
            <ContentEdit.Time
              item={currentChild}
              timeState={timeState}
              onFinish={onStepFinishHandler}
            />
          )}
          {currentTab === 'foodSelect' && (
            <SearchFood
              scheduleChild={currentChild}
              onFinish={onStepFinishHandler}
              searchState={filterState}
              onFocusChange={(focused) => searchFocusState.setSearchFocused(focused)}
            >
              <SearchFoodControls searchState={filterState} isVisible={true} />
            </SearchFood>
          )}
          {currentTab === 'quantity' && (
            <ContentEdit.Quantity item={currentChild} onFinish={onFinish} />
          )}
        </WizardStep>
      </ModalLayout>
    );
  }
);

SearchFoodControls.motionKey = 'food';
TimeNow.motionKey = 'time';

export default ScheduleFoodAdd;
