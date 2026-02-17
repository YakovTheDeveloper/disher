import { updateDish } from '@/api/dish/dish.api';
import { updateSchedule } from '@/api/schedule/schedule.api';
import { DishBuilder } from '@/components/features/builders/DishBuilder';
import { ModalDishProvider } from '@/components/features/builders/DishBuilder/modalContext';
import { Dish } from '@/domain/dish/Dish.model';
import { RouterLinks } from '@/router';
import { dishStore, scheduleStore } from '@/store/rootStore';
import { domainStore } from '@/store/store';
import { observer } from 'mobx-react-lite';
import { Instance } from 'mobx-state-tree';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useRequiredRouteParam } from '@/hooks/useRequiredRouteParam';

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
  const navigate = useNavigate();
  const { paramId: dishIdParam, isValid } = useRequiredRouteParam({
    navigateToUrlOnFail: RouterLinks.Schedule,
  });

  useEffect(() => {
    if (location.search) {
      navigate(location.pathname, { replace: true });
    }
  }, [navigate]);

  if (!isValid) return null;

  return <Page dishIdParam={Number(dishIdParam)} />;
};

export default observer(PageWrapper);
