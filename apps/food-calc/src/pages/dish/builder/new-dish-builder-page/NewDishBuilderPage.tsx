import { addDish } from '@/api/dish/dish.api';
import { updateSchedule } from '@/api/schedule/schedule.api';
import { DishBuilder } from '@/components/blocks/builders/food/DishBuilder';
import { createDishLocal } from '@/components/blocks/builders/food/DishBuilder/model/DishBuilderViewModel';
import { FoodQuantityDTO } from '@/components/blocks/builders/food/shared/dto';
import { Storage } from '@/infrastructure/storage';
import { dishStore, scheduleStore } from '@/store/rootStore';
import { observer } from 'mobx-react-lite';
import { useNavigate, useSearchParams } from 'react-router-dom';

const NewDishBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const navigatedFromParam = searchParams.has('navigated_from_schedule');
  const navigate = useNavigate();

  const seedFromStorage = Storage.get('dataForDishCreation') as FoodQuantityDTO[];
  const initDishItems = navigatedFromParam ? seedFromStorage : [];

  const initDish = createDishLocal(initDishItems);

  const onSave = async (data) => {
    // const result = await addDish(data);
    // if (!result) return;
    // dishStore.set(result.id, result);

    if (navigatedFromParam) {
      navigate(-1);
      return;
    }

    navigate(`/dish/builder?id=${result.id}`, { replace: true });
  };

  return <DishBuilder init={initDish} finishButtonTitle="Создать блюдо" onSave={onSave} />;
};

export default observer(NewDishBuilderPage);
