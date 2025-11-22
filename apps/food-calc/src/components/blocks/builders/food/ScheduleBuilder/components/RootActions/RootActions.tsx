import { observer } from 'mobx-react-lite';
import styles from './RootActions.module.scss';
import { Actions } from '@/components/blocks/builders/food/shared/ui/Actions';
import { Button as ActionButton } from '@/components/blocks/builders/food/shared/ui/Actions/button';
import { useCallback } from 'react';

type Props = {
  onFoodsOpenCreate: () => void;
  onEventContentCreateModalOpen: () => void;
  options: {
    currentPage: number;
    getShowMoreOptions: (value: number) => { showAdditionals: boolean };
    togglePagesShowMoreOptions: (value: number) => void;
  };
  isLoading: () => boolean;
  modals: {
    current: string | null;
  };
  schedule: {
    isNoItems: boolean;
    isNoDailyEventItems: boolean;
    itemsLength: number;
  };
  onFinishHandler: () => void;
};

const RootActions = ({
  options,
  onFoodsOpenCreate,
  onEventContentCreateModalOpen,
  onFinishHandler,
  isLoading,
  modals,
  schedule,
}: Props) => {
  const shouldTotalNutrientsShow = () => {
    if (options.currentPage === 0 && !modals.current) return true;
    return false;
  };

  const shouldFoodActionsShow = () => {
    if (modals.current) return false;
    const loading = isLoading();
    if (loading) return false;
    return options.currentPage === 1;
  };

  const shouldDailyEventsBuilderActionShow = () => {
    if (modals.current) return false;
    const loading = isLoading();
    if (loading) return false;
    return options.currentPage === 2;
  };

  const onMoreOptionsCLickNutrients = () => options.togglePagesShowMoreOptions(0);
  const onMoreOptionsCLickFood = () => options.togglePagesShowMoreOptions(1);
  const onMoreOptionsCLickDailyEvents = () => options.togglePagesShowMoreOptions(2);

  const showAdditionalsTotalNutrients = options.getShowMoreOptions(0);
  const showAdditionalsFood = options.getShowMoreOptions(1);
  const showAdditionalsDailyEvents = options.getShowMoreOptions(2);

  return (
    <>
      <Actions isShow={shouldTotalNutrientsShow}>
        <ActionButton.AdditionalOptions
          options={showAdditionalsTotalNutrients}
          isShow={() => true}
          className={styles.nutrientMoreButton}
          onClick={onMoreOptionsCLickNutrients}
        />
      </Actions>
      <Actions isShow={shouldFoodActionsShow}>
        <ActionButton.Finish
          onClick={onFinishHandler}
          content={schedule}
          isShow={() => !schedule.isNoItems}
        >
          сохранить
        </ActionButton.Finish>
        <ActionButton.Add onClick={onFoodsOpenCreate} animate={() => schedule.isNoItems} />
        <ActionButton.AdditionalOptions
          options={showAdditionalsFood}
          isShow={() => !schedule.isNoItems}
          onClick={onMoreOptionsCLickFood}
        />
      </Actions>
      <Actions isShow={shouldDailyEventsBuilderActionShow}>
        <ActionButton.Finish
          onClick={onFinishHandler}
          content={schedule}
          isShow={() => !schedule.isNoDailyEventItems}
        >
          сохранить
        </ActionButton.Finish>
        <ActionButton.Add
          onClick={onEventContentCreateModalOpen}
          animate={() => schedule.isNoDailyEventItems}
        />
        <ActionButton.AdditionalOptions
          onClick={onMoreOptionsCLickDailyEvents}
          options={showAdditionalsDailyEvents}
          isShow={() => !schedule.isNoDailyEventItems}
        />
      </Actions>
    </>
  );
};

export default observer(RootActions);
