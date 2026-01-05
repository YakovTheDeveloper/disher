import { observer, useLocalObservable } from 'mobx-react-lite';
import styles from './ScheduleFoodAdd.module.scss';
import { SearchFood } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { Instance } from 'mobx-state-tree';
import { DaySchedule, ScheduleItem } from '@/domain/schedule/schedule';
import { useMemo } from 'react'; // Import useCallback
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ContentEdit } from '@/components/features/builders/food/shared/ContentEdit';
import { useDailyScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/modalContext';
import { Tabs } from '@/components/ui/Tabs';
import clsx from 'clsx';
import { mstEnv, domainStore } from '@/store/store';
import { filterBy } from '@/lib/filter/filter';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { useItemCreationSteps } from '@/components/features/builders/food/shared/hooks/useItemCreationSteps';
import { FinishButton } from '@/components/features/builders/food/shared/atoms/FinishButton';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { SearchFoodControls } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd/SearchFoodControls';

type TabValue = 'info' | 'foodSelect' | 'quantity' | 'time';

type SearchTabs = 'productSearch' | 'dishSearch' | 'createCustom';

type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
};

const ScheduleFoodAdd = observer(({ schedule }: Props) => {
  const modals = useDailyScheduleModals();

  // const currentChild = schedule.draft.food;
  const currentChild = useMemo(
    () =>
      ScheduleItem.create(
        {
          id: 'draft-food',
          quantity: 100,
          time: schedule.lastTimeItemAdded || '12:00',
          content: { variant: 'custom', customName: 'Мой продукт' },
        },
        mstEnv
      ),
    []
  );

  const onFinish = () => {
    schedule.addDraftToFoods(currentChild);
    modals.close();
  };

  const searchState = useLocalObservable(() => ({
    currentTab: 'productSearch' as SearchTabs,
    filterText: '',
    customProductText: currentChild?.content?.customName || '',

    setTab(tab: SearchTabs) {
      this.currentTab = tab;
    },

    setSearch(text: string) {
      this.filterText = text;
    },

    setCustomText(text: string) {
      this.customProductText = text;
    },

    foodSearchState: {
      get filterSearchText() {
        return searchState.filterText;
      },
      get localFiltered() {
        return filterBy(domainStore.foodStore.list, this.filterSearchText, ['name', 'title']);
      },
    },

    dishSearchState: {
      get filterSearchText() {
        return searchState.filterText;
      },
      get localFiltered() {
        return filterBy(domainStore.dishStore.list, this.filterSearchText, ['name', 'title']);
      },
    },
  }));

  const tabs = [
    { value: 'time', label: 'время', alternativeLabel: currentChild.time },
    { value: 'foodSelect', label: 'еда', alternativeLabel: currentChild.content.name },
    { value: 'quantity', label: 'количество', alternativeLabel: currentChild.quantity },
  ];

  const { currentStep, visibleSteps, setStepByValue, maxStepReached, onStepFinish } =
    useItemCreationSteps(tabs, onFinish);

  return (
    <DrawerLayout
      label={<ScreenLabel className={styles.title}>Добавить</ScreenLabel>}
      tabs={
        <>
          <Tabs
            tabs={visibleSteps}
            current={currentStep}
            setTab={setStepByValue}
            variant="scheduleFoodAdd"
          />
        </>
      }
      subHeader={
        currentStep === 'foodSelect' && (
          <SearchFoodControls searchState={searchState} isVisible={true} />
        )
      }
      bottom={
        <>
          <FinishButton maxStepReached={maxStepReached} onClick={onFinish} />
        </>
      }
    >
      {currentStep === 'time' && <ContentEdit.Time item={currentChild} onFinish={onStepFinish} />}
      {currentStep === 'foodSelect' && (
        <SearchFood
          scheduleChild={currentChild}
          onFinish={onStepFinish}
          searchState={searchState}
        />
      )}
      {currentStep === 'quantity' && (
        <ContentEdit.Quantity item={currentChild} onFinish={onStepFinish} />
      )}
    </DrawerLayout>
  );
});

export default ScheduleFoodAdd;
