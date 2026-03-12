import { updateDish } from '@/api/dish/dish.api';
import { updateSchedule } from '@/api/schedule/schedule.api';
import { DishBuilder } from '@/components/features/builders/DishBuilder';
import { ModalDishProvider } from '@/components/features/builders/DishBuilder/modalContext';
import { Dish } from '@/domain/dish/Dish.model';
import { RouterLinks } from '@/router';
import { domainStore } from '@/store/store';
import { observer } from 'mobx-react-lite';
import { Instance } from 'mobx-state-tree';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useRequiredRouteParam } from '@/hooks/useRequiredRouteParam';

type Props = {};

const Page = ({}: Props) => {
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();

  if (!id) {
    console.error('Dish ID is required but not found in URL');
    return null;
  }

  const current = domainStore.dishStore.getEntity(id);

  const onSave = async (data: Instance<typeof Dish>) => {
    // domainStore.interactionsService.fetchSyncDishes([data]);
  };

  const onInit = async () => {
    return;
  };

  useEffect(() => {
    onInit();
  }, []);

  return current ? <DishBuilder init={current} /> : null;
};

export default observer(Page);
