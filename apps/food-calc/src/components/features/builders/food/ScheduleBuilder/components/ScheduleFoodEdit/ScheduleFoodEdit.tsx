import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodEdit.module.scss';
import { FoodAdd } from '@/components/features/builders/food/ScheduleBuilder/components/FoodAdd';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule';
import { FoodNutrients } from '@/components/features/builders/food/shared/components/FoodNutrients';
import { useSearchParams } from 'react-router';
import { DishNutrients } from '@/components/features/builders/food/ScheduleBuilder/components/DishNutrients';
import { useState, useCallback } from 'react'; // Import useCallback
import { TimePicker } from '@/components/features/builders/food/ScheduleBuilder/components/TimePicker';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';

type Props = {
  children?: React.ReactNode;
  schedule: Instance<typeof DaySchedule>;
};

type TabValue = 'info' | 'edit';

const ScheduleFoodEdit = observer(({ schedule }: Props) => {
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('item_id');

  const [tab, setTab] = useState<TabValue>('edit');
  const [tab2, setTab2] = useState<TabValue>('productSearch');

  const currentChild = schedule.getChildById(itemId);

  if (!currentChild) return null;

  const variant = currentChild.content.variant;
  const foodId = currentChild.content.foodId;
  const dish = currentChild.content.dish;

  const onTimeChangeFinishUpdate = (value: string) => {
    schedule.updateTime(itemId, value);
  };

  const handleTabChange = useCallback((newTab: TabValue) => {
    setTab(newTab);
  }, []);

  return (
    <div>
      <ScreenLabel className={styles.title}>Редактирование приема пищи</ScreenLabel>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.tabs}>
            {tab !== 'edit' && (
              <button
                className={`${styles.tabButton} ${tab === 'edit' ? styles.activeTab : ''}`}
                onClick={() => handleTabChange('edit')}
                aria-selected={tab === 'edit'}
                role="tab"
              >
                Поменять еду
              </button>
            )}
            {tab == 'edit' && (
              <div className={styles.tabs2}>
                <span
                  className={`${styles.tabButton} ${tab2 === 'productSearch' ? styles.active : ''}`}
                  onClick={() => setTab2('productSearch')}
                >
                  Продукты
                </span>
                <span
                  className={`${styles.tabButton} ${tab2 === 'dishSearch' ? styles.active : ''}`}
                  onClick={() => setTab2('dishSearch')}
                >
                  Блюда
                </span>
                <span
                  className={`${styles.tabButton} ${tab2 === 'createCustom' ? styles.active : ''}`}
                  onClick={() => setTab2('createCustom')}
                >
                  Кастомный продукт
                </span>
              </div>
            )}
            <TimePicker value={currentChild.time} onFinish={onTimeChangeFinishUpdate} />
            <button
              className={`${styles.tabButton} ${tab === 'info' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('info')}
              aria-selected={tab === 'info'}
              role="tab"
            >
              Информация
            </button>
          </div>
        </header>

        {/* <div className={styles.header2}>
          <div className={styles.tabs2}>
            <span
              className={`${styles.tabButton} ${tab2 === 'productSearch' ? styles.active : ''}`}
              onClick={() => setTab2('productSearch')}
            >
              Продукты
            </span>
            <span
              className={`${styles.tabButton} ${tab2 === 'dishSearch' ? styles.active : ''}`}
              onClick={() => setTab2('dishSearch')}
            >
              Блюда
            </span>
            <span
              className={`${styles.tabButton} ${tab2 === 'createCustom' ? styles.active : ''}`}
              onClick={() => setTab2('createCustom')}
            >
              Кастомный продукт
            </span>
          </div>
        </div> */}

        {tab === 'info' && (
          <div>
            {variant === 'dish' && dish && (
              <DishNutrients schedule={schedule} currentDish={dish} currentChild={currentChild} />
            )}
            {variant === 'food' && foodId && <FoodNutrients foodId={foodId} />}
          </div>
        )}
        {tab === 'edit' && <FoodAdd store={schedule} />}
      </div>
    </div>
  );
});

export default ScheduleFoodEdit;
