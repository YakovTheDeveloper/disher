import { updateDish } from '@/api/dish/dish.api';
import { updateSchedule } from '@/api/schedule/schedule.api';
import { DishBuilder } from '@/components/blocks/builders/food/DishBuilder';
import { ModalDishProvider } from '@/components/blocks/builders/food/DishBuilder/modalContext';
import { RouterLinks } from '@/router';
import { dishStore, scheduleStore } from '@/store/rootStore';
import { domainStore } from '@/store/store';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

const DishBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const dishIdParam = searchParams.get('id');
  const scheduleDateParam = searchParams.get('add_to');

  const navigate = useNavigate();

  const current = domainStore.dishStore.data.get(dishIdParam);

  const onSave = async (data, id) => {
    if (scheduleDateParam && dishIdParam) {
      domainStore.interactionsService.onDishSaveFromScheduleFood(dishIdParam, scheduleDateParam);
      navigate(RouterLinks.ScheduleBuilder + '?date=' + scheduleDateParam, { replace: true });
    }

    // const result = await updateDish(data, id);
    // if (!result) return;
    // dishStore.set(result.id, result);
  };

  const onInit = async () => {
    if (!dishIdParam) {
      const model = domainStore.dishStore.addLocal({ isDraft: true });
      navigate(RouterLinks.DishBuilder + '?id=' + model.id, { replace: true });
      return;
    }

    return;

    const { code, data = null } = await domainStore.daySchedule.getOneByDate(date);

    if (code === 404) {
      domainStore.daySchedule.addLocal({ date, isDraft: true });
    }

    if (data) {
      domainStore.daySchedule.addLocal({ ...data, isDraft: false });
    }
  };

  useEffect(() => {
    onInit();
  }, []);

  return (
    <ModalDishProvider>
      {current && <DishBuilder init={current} finishButtonTitle="Обновить" onFinish={onSave} />}
    </ModalDishProvider>
  );
};

export default observer(DishBuilderPage);
