import { updateDish } from '@/api/dish/dish.api';
import { updateSchedule } from '@/api/schedule/schedule.api';
import { DishBuilder } from '@/components/blocks/builders/food/DishBuilder';
import { dishStore, scheduleStore } from '@/store/rootStore';
import { observer } from 'mobx-react-lite';
import { useSearchParams } from 'react-router';

const DishBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  if (!id) return null;
  const init = dishStore.data.get(id);

  if (!init) return null;

  const onSave = async (data, id) => {
    const result = await updateDish(data, id);
    if (!result) return;
    dishStore.set(result.id, result);
  };

  return <DishBuilder init={init} finishButtonTitle="Обновить" onSave={onSave} />;
};

export default observer(DishBuilderPage);
