import { useNavigate } from 'react-router';
import { useState } from 'react';
import {
  SearchFood,
  SearchFoodButton,
} from '@/components/features/builders/shared/components/SearchFood';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';
import style from './ScheduleFood.module.scss';
import Button from '@/components/ui/atoms/Button/Button';
import { ScheduleFoodCommonForm } from '@/components/features/builders/ScheduleBuilder/components/layout/ScheduleItemCommonForm';
import Logo from '@/assets/icons/logo.svg';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { TimeChoose } from '@/components/ui/TimeChoose';
import { useEmitter } from '@/hooks/useEmitter';
import type { ScheduleFood as ScheduleFoodType } from '@/entities/schedule-food';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { scrollToElement } from '@/lib/scroll';

interface ScheduleFoodProps {
  scheduleChildItem: ScheduleFoodType;
  parentScheduleId: string; // DD-MM-YYYY format, e.g. "15-09-2024"
  scheduleStore?: any; // TODO: replace with Triplit mutation hooks
}

const ScheduleFoodComponent = (props: ScheduleFoodProps) => {
  const isDraft = props.scheduleChildItem.id === 'DRAFT';
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const { toScheduleBuilder } = useAppRoutes();

  const { parentScheduleId, scheduleChildItem: currentChild, scheduleStore } = props;

  const handleTimeFinish = (time: string) => {
    currentChild.updateTime(time);
    // Auto-scroll to next section
    // Delay scroll to allow keyboard to dismiss and viewport to settle
    scrollToElement('schedule-item-form', 'food-section', { behavior: 'auto', delay: 100 });
  };

  const onFoodAdd = (payload: { variant: 'dish' | 'product'; id: string }) => {
    currentChild.update(payload.variant, payload.id);
    setIsSearchExpanded(false);
  };

  const handleFinish = () => {
    if (isDraft) {
      scheduleStore?.commitFoodDraft(parentScheduleId);
    }
    toScheduleBuilder(parentScheduleId);
  };

  const handleQuantityFinish = () => {
    // handleFinish();
  };

  useEmitter('back', () => setIsSearchExpanded(false));

  return (
    <ScheduleFoodCommonForm
      time={currentChild.time}
      button={
        <Button variant="primary" onClick={handleFinish}>
          Готово
        </Button>
      }
    >
      <div className={style.section} id="time-section">
        <TimeChoose onFinish={handleTimeFinish} initialTime={currentChild.time} />
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
            />
          }
        ></SearchFormExpandable>
      </div>
      {currentChild.content && (
        <div className={style.section} id="quantity-section">
          <ContentEdit.Quantity content={currentChild.content} onFinish={handleQuantityFinish} />
        </div>
      )}
    </ScheduleFoodCommonForm>
  );
};

export default ScheduleFoodComponent;
