import { updateSchedule } from '@/api/schedule.api';
import { ScheduleBuilder } from '@/components/blocks/ScheduleBuilder';
import { createLocalSchedule } from '@/components/blocks/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { scheduleStore } from '@/store/rootStore';
import { observer } from 'mobx-react-lite';
import { useSearchParams } from 'react-router-dom';

const ScheduleBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');

  if (!date) return null;

  const initSchedule = scheduleStore.dateToSchedule.get(date);

  const onSave = async (data, id) => {
    const result = await updateSchedule(data, id);
    if (!result) return;
    const { date } = result;
    scheduleStore.set(date, result);
  };

  return <ScheduleBuilder init={initSchedule} finishButtonTitle="Обновить" onSave={onSave} />;
};

export default observer(ScheduleBuilderPage);
