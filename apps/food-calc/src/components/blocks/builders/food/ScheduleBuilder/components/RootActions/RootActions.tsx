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
  };
  isLoading: () => boolean;
  modals: {
    current: boolean;
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

  return (
    <>
      <Actions isShow={shouldTotalNutrientsShow}>
        <ActionButton.AdditionalOptions options={options} isShow={() => true} />
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
        <ActionButton.AdditionalOptions options={options} isShow={() => !schedule.isNoItems} />
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
          options={options}
          isShow={() => !schedule.isNoDailyEventItems}
        />
      </Actions>
    </>
  );
};

export default observer(RootActions);
