import { addSchedule } from '@/api/schedule.api';
import { ScheduleBuilder } from '@/components/blocks/ScheduleBuilder';
import { createLocalSchedule } from '@/components/blocks/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { scheduleStore } from '@/store/rootStore';
import { observer } from 'mobx-react-lite';
import { useNavigate, useSearchParams } from 'react-router-dom';

const NewScheduleBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const initDate = searchParams.get('initDate');
  const navigate = useNavigate();

  const onSave = async (data, id) => {
    const result = await addSchedule(data, id);
    if (!result) return;
    const { date } = result;
    scheduleStore.set(date, result);
    navigate(`/schedule/builder?date=${date}`, { replace: true });
  };

  return (
    <ScheduleBuilder
      init={createLocalSchedule(initDate || '')}
      finishButtonTitle="Создать"
      onSave={onSave}
    />
  );
};

export default observer(NewScheduleBuilderPage);
