import { addSchedule } from '@/api/schedule/schedule.api';
import { ScheduleBuilder } from '@/components/blocks/builders/food/ScheduleBuilder';
import { createLocalSchedule } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { Menu } from '@/components/common/Menu';
import { Button } from '@/components/ui/Button';
import { scheduleStore } from '@/store/rootStore';
import { MenuUiStore } from '@/store/uiStore/menu/menuUiStore';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const NewScheduleBuilderPage = () => {
  const [searchParams] = useSearchParams();
  const initDate = searchParams.get('initDate');
  const navigate = useNavigate();
  const menuUi = useMemo(() => new MenuUiStore(), []);

  const onSave = async (data, id) => {
    console.log('onsave', data, id);
    const result = await addSchedule(data, id);
    if (!result) return;
    const { date } = result;
    scheduleStore.set(date, result);
    navigate(`/schedule/builder?date=${date}`, { replace: true });
  };

  return (
    <>
      <ScheduleBuilder
        init={createLocalSchedule(initDate || '')}
        finishButtonTitle="Создать"
        onSave={onSave}
      >
        <Button.Menu menu={menuUi} onClick={menuUi.open} />
      </ScheduleBuilder>
      <Menu store={menuUi} />
    </>
  );
};

export default observer(NewScheduleBuilderPage);
