import { observer } from 'mobx-react-lite';
import { Dish } from '@/domain/dish/Dish.model';
import { Food } from '@/domain/product/Food.model';
import { drawerStoreV3 } from '@/store/GlobalUiStore/DrawerStoreV3/DrawerStoreV3';
import { AddToDayScheduleDrawer } from '@/components/widgets/drawers/add-to-day-schedule-drawer';
import styles from './AddToDaySchedule.module.scss';
import { Instance } from 'mobx-state-tree';
import { useFoodScheduleStore } from '@/app/stores/helpers';
import { FoodScheduleStoreType } from '@/store/FoodScheduleStore/FoodScheduleStore';

type AddToDayScheduleItem = Instance<typeof Dish> | Instance<typeof Food>;

type Props = {
  item: AddToDayScheduleItem;
  foodScheduleStore?: FoodScheduleStoreType;
};

const AddToDaySchedule = ({ item, foodScheduleStore = useFoodScheduleStore() }: Props) => {
  const handleClick = async () => {
    const date = await drawerStoreV3.show(AddToDayScheduleDrawer, { item, title: item.name });
    if (date) {
      let schedule = foodScheduleStore.getLocal(date);

      if (!schedule) {
        foodScheduleStore.addLocal({ id: date });
        schedule = foodScheduleStore.getLocal(date);
      }

      if (schedule) {
        const isDish = Dish.is(item);

        const content = isDish
          ? { contentDish: { dishId: item.id, variant: 'dish' as const, quantity: 100 } }
          : { contentProduct: { foodId: item.id, variant: 'product' as const, quantity: 100 } };

        const currentTime = new Date().toTimeString().slice(0, 5);
        schedule.foods.addChildWithLocalData({
          time: currentTime,
          ...content,
        });
      }

      console.log('Added to schedule:', date);
    }
  };

  return (
    <button
      type="button"
      className={styles.container}
      onClick={handleClick}
      aria-label="Add to day schedule"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="4"
          fill="#9CA3AF"
        />
        <path
          d="M12 7V17M7 12H17"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
};
export default observer(AddToDaySchedule);
