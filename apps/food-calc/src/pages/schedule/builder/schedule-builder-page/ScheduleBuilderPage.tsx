import { updateSchedule } from '@/api/schedule/schedule.api';
import { ScheduleBuilder } from '@/components/blocks/builders/food/ScheduleBuilder';
import { createLocalSchedule } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { scheduleStore } from '@/store/rootStore';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useSearchParams } from 'react-router-dom';

const ScheduleBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');

  if (!date) return null;

  const initSchedule = scheduleStore.dateToSchedule.get(date);

  console.log(toJS(initSchedule));

  const onSave = async (data, id) => {
    const result = await updateSchedule(data, id);
    if (!result) return;
    const { date } = result;
    scheduleStore.set(date, result);
  };

  return <ScheduleBuilder init={initSchedule} finishButtonTitle="Обновить" onSave={onSave} />;
};

export default observer(ScheduleBuilderPage);
