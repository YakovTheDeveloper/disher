import { updateDish } from '@/api/dish/dish.api';
import { updateSchedule } from '@/api/schedule/schedule.api';
import { DishBuilder } from '@/components/features/builders/food/DishBuilder';
import { ModalDishProvider } from '@/components/features/builders/food/DishBuilder/modalContext';
import { Dish } from '@/domain/dish/Dish';
import { RouterLinks } from '@/router';
import { dishStore, scheduleStore } from '@/store/rootStore';
import { domainStore } from '@/store/store';
import { observer } from 'mobx-react-lite';
import { Instance } from 'mobx-state-tree';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';

type Props = {
  dishIdParam: number;
};

const Page = ({ dishIdParam }: Props) => {
  const navigate = useNavigate();

  const current = domainStore.dishStore.user.entities.get(dishIdParam);

  const onSave = async (data: Instance<typeof Dish>) => {
    domainStore.interactionsService.fetchSyncDishes([data]);

    // const result = await updateDish(data, id);
    // if (!result) return;
    // dishStore.set(result.id, result);
  };

  const onInit = async () => {
    return;

    const { code, data = null } = await domainStore.scheduleStore.getOneByDate(date);

    if (code === 404) {
      domainStore.scheduleStore.addLocal({ date, isDraft: true });
    }

    if (data) {
      domainStore.scheduleStore.addLocal({ ...data, isDraft: false });
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

const PageWrapper = () => {
  const params = useParams();
  const dishIdParam = params.id;
  const navigate = useNavigate();

  useEffect(() => {
    if (!dishIdParam) {
      navigate(RouterLinks.Schedule);
    }
  }, [dishIdParam]);

  useEffect(() => {
    if (location.search) {
      navigate(location.pathname, { replace: true });
    }
  }, []);

  if (!dishIdParam) return null;

  return <Page dishIdParam={dishIdParam} />;
};

export default observer(PageWrapper);
