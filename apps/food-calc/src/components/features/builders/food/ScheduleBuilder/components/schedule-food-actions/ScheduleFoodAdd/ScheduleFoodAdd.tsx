import { observer, useLocalObservable } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useMemo, useEffect, useState } from 'react';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { Tabs } from '@/components/ui/Tabs';
import { domainStore } from '@/store/store';
import ModalLayout from '@/components/features/builders/food/shared/components/ModalLayout/ModalLayout';
import { WizardStep } from '@/components/features/builders/food/shared/components/WizardStep';
import { useTabs } from '@/components/features/builders/food/shared/hooks/useTabs';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';
import {
  useDraftScheduleItem,
  useSchedule,
  useSelectedScheduleItem,
} from '@/components/features/builders/food/ScheduleBuilder/context';
import { useFilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance } from '@/store/types';
import { TimeNow } from '@/components/features/builders/food/shared/ContentEdit/Time/TimeNow';
import WeatherBackground from '@/components/features/WeatherBackground/WeatherBacground';
import styles from './ScheduleFoodAdd.module.scss';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import {
  DrawerStoreInstance,
  ProductDrawers,
  ScheduleDrawers,
} from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import RoundedPlusIcon from '@/assets/icons/rounded-plus-icon.svg';
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
    console.log('currentChild', currentChild);

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
        close();
      }
    };

    const tabs = [
      { value: 'time', label: 'время', alternativeLabel: currentChild.time },
      {
        value: 'foodSelect',
        label: 'еда',
        alternativeLabel: currentChild.content?.name || 'не установлено',
      },
      { value: 'quantity', label: 'количество', alternativeLabel: `${currentChild.quantity}` },
    ];

    const { currentTab, goNext, setTab: originalSetTab } = useTabs(tabs, defaultTab);
    const [direction, setDirection] = useState(1);

    const tabToIndex = {
      time: 0,
      foodSelect: 1,
      quantity: 2,
    } as const;

    const indexToTab = ['time', 'foodSelect', 'quantity'] as const;

    const setTab = (value: (typeof tabs)[number]['value']) => {
      const newIndex = tabToIndex[value];
      const currentIndex = tabToIndex[currentTab as keyof typeof tabToIndex];
      setDirection(newIndex > currentIndex ? 1 : -1);
      originalSetTab(value);
    };

    const handleBack = () => {
      const currentIndex = tabToIndex[currentTab as keyof typeof tabToIndex];
      if (currentIndex > 0) {
        setTab(indexToTab[currentIndex - 1]);
      } else {
        close();
      }
    };

    const onProductChoose = () => {
      // setTab('quantity');
      setTimeout(() => setTab('quantity'), 0);
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

    const supFooter = (() => {
      switch (currentTab) {
        case 'foodSelect':
          return (
            <div className={styles.bottomPanel}>
              <button className={styles.helpFocusButton}>Выбор</button>
            </div>
          );
        case 'quantity':
          return (
            <div className={styles.bottomPanel}>
              <button className={styles.helpFocusButton}>Выбор</button>

              <FinishButton onClick={onFinish} variant="text">
                добавить еду
              </FinishButton>
            </div>
          );
        default:
          return null;
      }
    })();

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
        // onBack={tabToIndex[currentTab as keyof typeof tabToIndex] > 0 ? handleBack : close}
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
          {currentTab === 'time' && (
            <ContentEdit.Time item={currentChild} timeState={timeState} onFinish={() => goNext()} />
          )}
          {currentTab === 'foodSelect' && (
            <SearchFood
              scheduleChild={currentChild}
              onFinish={onProductChoose}
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
