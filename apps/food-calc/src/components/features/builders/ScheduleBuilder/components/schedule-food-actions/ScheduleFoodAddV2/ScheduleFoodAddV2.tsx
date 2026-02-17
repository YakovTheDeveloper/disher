import { observer, useLocalObservable } from 'mobx-react-lite';
import { useNavigate } from 'react-router';
import { SearchFoodButton } from '@/components/features/builders/shared/components/SearchFood';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance, RootInstance } from '@/store/RootStoreModel';
import { TimeNow } from '@/components/features/builders/shared/ContentEdit/Time/TimeNow';
import style from './ScheduleFoodAddV2.module.scss';
import Button from '@/components/ui/atoms/Button/Button';
import { ScheduleItemCommonForm } from '@/components/features/builders/ScheduleBuilder/components/layout/ScheduleItemCommonForm';
import { useOverlay } from '@/store/GlobalUiStore/OverlayStore';
import { modalStoreV2 } from '@/store/GlobalUiStore/ModalStoreV2/ModalStoreV2';
import { ModalSearchFood } from '@/components/features/builders/shared/modals/ModalSearchFood';

interface ScheduleFoodAddV2Props {
  foodStore: FoodStoreInstance;
  dishStore: DishStoreInstance;
  scheduleStore: RootInstance['scheduleStore'];
  scheduleChildItem: RootInstance['scheduleStore']['foodDraft'];
  parentScheduleId: string; // DD-MM-YYYY format, e.g. "15-09-2024"
}

const ScheduleFoodAddV2 = observer((props: ScheduleFoodAddV2Props) => {
  const navigate = useNavigate();
  const { openSearchFood } = useOverlay();

  const { parentScheduleId, scheduleChildItem: currentChild, scheduleStore } = props;

  const timeState = useLocalObservable(() => ({
    localTime: currentChild.time,
    handleTimeUpdate(newTime: string) {
      this.localTime = newTime;
      currentChild.updateTime(newTime);
    },
  }));

  const handleFinish = () => {
    scheduleStore.commitFoodDraft(parentScheduleId);
    navigate(-1);
  };

  const handleTimeFinish = () => {
    // Auto-scroll to next section
    const foodSection = document.getElementById('food-section');
    if (foodSection) {
      foodSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFoodFinish = () => {
    // Auto-scroll to quantity section
    const quantitySection = document.getElementById('quantity-section');
    if (quantitySection) {
      quantitySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuantityFinish = () => {
    handleFinish();
  };

  const openSearchFoodWithArgs = async () => {
    const result = await modalStoreV2.show(ModalSearchFood, {
      productId: currentChild.contentProduct?.foodId,
      dishId: currentChild.contentDish?.dishId,
    });
    const { variant, id } = result;
    currentChild.update(variant, id);
    handleFoodFinish();
  };

  return (
    <ScheduleItemCommonForm
      time={timeState.localTime}
      button={
        <Button variant="primary" onClick={handleFinish}>
          Готово
        </Button>
      }
    >
      <div className={style.section} id="time-section">
        <ContentEdit.Time timeState={timeState} onFinish={handleTimeFinish} />
      </div>
      <div className={style.section} id="food-section">
        <SearchFoodButton
          placeholder="Добавить продукт или блюдо"
          text={currentChild.content?.name}
          onClick={openSearchFoodWithArgs}
        />
      </div>
      {currentChild.content && (
        <div className={style.section} id="quantity-section">
          <ContentEdit.Quantity content={currentChild.content} onFinish={handleQuantityFinish} />
        </div>
      )}
    </ScheduleItemCommonForm>
  );
});

TimeNow.motionKey = 'time';

export default ScheduleFoodAddV2;
