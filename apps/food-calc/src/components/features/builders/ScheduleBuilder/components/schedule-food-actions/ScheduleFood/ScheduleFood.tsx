import { observer, useLocalObservable } from 'mobx-react-lite';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import {
  SearchFood,
  SearchFoodButton,
} from '@/components/features/builders/shared/components/SearchFood';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance, RootInstance } from '@/store/RootStoreModel';
import { TimeNow } from '@/components/features/builders/shared/ContentEdit/Time/TimeNow';
import style from './ScheduleFood.module.scss';
import Button from '@/components/ui/atoms/Button/Button';
import { ScheduleItemCommonForm } from '@/components/features/builders/ScheduleBuilder/components/layout/ScheduleItemCommonForm';
import { modalStoreV2 } from '@/store/GlobalUiStore/ModalStoreV2/ModalStoreV2';
import { ModalSearchFood } from '@/components/features/builders/shared/modals/ModalSearchFood';
import Logo from '@/assets/icons/logo.svg';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { ButtonBack } from '@/components/ui/atoms/Button/ButtonBack';
import { RouterUrls } from '@/router';
import { TimeChoose } from '@/components/ui/TimeChoose';

interface ScheduleFoodProps {
  foodStore: FoodStoreInstance;
  dishStore: DishStoreInstance;
  scheduleStore: RootInstance['foodScheduleStore'];
  scheduleChildItem: RootInstance['foodScheduleStore']['foodDraft'];
  parentScheduleId: string; // DD-MM-YYYY format, e.g. "15-09-2024"
}

const ScheduleFood = observer((props: ScheduleFoodProps) => {
  const navigate = useNavigate();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const { parentScheduleId, scheduleChildItem: currentChild, scheduleStore } = props;

  // const timeState = useLocalObservable(() => ({
  //   localTime: currentChild.time,
  //   handleTimeUpdate(newTime: string) {
  //     this.localTime = newTime;
  //     currentChild.updateTime(newTime);
  //   },
  // }));

  const handleFinish = () => {
    navigate(RouterUrls.Schedule(parentScheduleId));
    scheduleStore.commitFoodDraft(parentScheduleId);
  };

  const handleTimeFinish = (time: string) => {
    currentChild.updateTime(time);
    // Auto-scroll to next section
    const foodSection = document.getElementById('food-section');
    if (foodSection) {
      foodSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const openSearchFoodWithArgs = async () => {
    // const result = await modalStoreV2.show(ModalSearchFood, {
    //   productId: currentChild.contentProduct?.foodId,
    //   dishId: currentChild.contentDish?.dishId,
    // });
    // console.log(result);
    // if (!result.id) return;
    // const { variant, id } = result;
    // currentChild.update(variant, id);
    // handleFoodFinish();
  };

  const onFoodAdd = (payload: { variant: 'dish' | 'product'; id: string }) => {
    currentChild.update(payload.variant, payload.id);
    // document.getElementById('search')?.blur();
    setIsSearchExpanded(false);
  };

  const handleQuantityFinish = () => {
    // handleFinish();
  };

  return (
    <ScheduleItemCommonForm
      time={currentChild.time}
      button={
        <Button variant="primary" onClick={handleFinish}>
          Готово
        </Button>
      }
    >
      <div className={style.section} id="time-section">
        <TimeChoose onFinish={handleTimeFinish} />
        {/* <ContentEdit.Time onFinish={handleTimeFinish} /> */}
      </div>
      <div className={style.section} id="food-section">
        <SearchFormExpandable
          isExpanded={isSearchExpanded}
          trigger={
            <SearchFoodButton
              onClick={() => setIsSearchExpanded(true)}
              leftSlot={
                <span
                  style={{
                    fontSize: '1.5em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Logo />
                </span>
              }
              placeholder="Добавить продукт или блюдо"
              chosenFoodTitle={currentChild.content?.name}
            />
          }
          content={
            <SearchFood
              mode="products-and-dishes"
              onFinish={onFoodAdd}
              currentDishId={currentChild.content?.dishId}
              currentProductId={currentChild.content?.foodId}
              beforeSearchInput={<ButtonBack onClick={() => setIsSearchExpanded(false)} />}
            />
          }
        ></SearchFormExpandable>
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

export default ScheduleFood;
