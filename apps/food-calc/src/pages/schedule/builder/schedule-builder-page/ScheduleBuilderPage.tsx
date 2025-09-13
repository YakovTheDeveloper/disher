import { updateSchedule } from '@/api/schedule/schedule.api';
import { ScheduleBuilder } from '@/components/blocks/builders/food/ScheduleBuilder';
import { createLocalSchedule } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { Menu } from '@/components/common/Menu';
import { Button } from '@/components/ui/Button';
import { scheduleStore, uiStore } from '@/store/rootStore';
import { MenuUiStore } from '@/store/uiStore/menu/menuUiStore';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const ScheduleBuilderPage = () => {
  const menuUi = useMemo(() => new MenuUiStore(), []);
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');

  if (!date) return null;

  const initSchedule = scheduleStore.dateToSchedule.get(date);

  if (!initSchedule) return null;

  const onSave = async (data, id) => {
    const result = await updateSchedule(data, id);
    if (!result) return;
    const { date } = result;
    scheduleStore.set(date, result);
  };

  return (
    <>
      <ScheduleBuilder init={initSchedule} finishButtonTitle="Обновить" onSave={onSave}>
        <Button.Menu menu={menuUi} onClick={menuUi.open} />
      </ScheduleBuilder>
      <Menu store={menuUi} />
    </>
  );
};

export default observer(ScheduleBuilderPage);
