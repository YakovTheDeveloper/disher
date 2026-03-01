import { observer, useLocalObservable } from 'mobx-react-lite';
import { useNavigate } from 'react-router';
import { ContentEdit } from '@/components/features/builders/shared/ContentEdit';
import { FoodStoreInstance } from '@/store/FoodStore/FoodStore';
import { DishStoreInstance, RootInstance } from '@/store/RootStoreModel';
import { ScheduleItemCommonForm } from '@/components/features/builders/ScheduleBuilder/components/layout/ScheduleItemCommonForm';
import Button from '@/components/ui/atoms/Button/Button';
import style from './ScheduleEventsAdd.module.scss';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import Textarea from '@/components/ui/atoms/Textarea/Textarea';
import { AtomBuilder } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/AtomBuilder';

interface ScheduleEventsAddProps {
  foodStore: FoodStoreInstance;
  dishStore: DishStoreInstance;
  scheduleStore: RootInstance['eventScheduleStore'];
  scheduleChildItem: RootInstance['eventScheduleStore']['eventDraft'];
  parentScheduleId: string;
}

const ScheduleEventsAdd = (props: ScheduleEventsAddProps) => {
  const navigate = useNavigate();

  const { parentScheduleId, scheduleChildItem: currentChild, scheduleStore } = props;

  const timeState = useLocalObservable(() => ({
    localTime: currentChild.time,
    handleTimeUpdate(newTime: string) {
      this.localTime = newTime;
      currentChild.updateTime(newTime);
    },
  }));

  const handleFinish = () => {
    scheduleStore.commitEventDraft(parentScheduleId);
    navigate(-1);
  };

  const handleTimeFinish = () => {
    const eventTypeSection = document.getElementById('event-type-section');
    if (eventTypeSection) {
      eventTypeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleEventTypeFinish = () => {
    const valueSection = document.getElementById('value-section');
    if (valueSection) {
      valueSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleValueFinish = () => {
    handleFinish();
  };

  const onTextChange = (value: string) => {
    currentChild.setText(value);
  };

  const handleEventChange = () => {
    // Trigger any external updates if needed
  };

  return (
    <ScheduleItemCommonForm
      time={timeState.localTime}
      button={
        <Button variant="primary" onClick={handleFinish}>
          Сохранить
        </Button>
      }
    >
      <div className={style.section} id="time-section">
        <ContentEdit.Time timeState={timeState} onFinish={handleTimeFinish} />
      </div>
      <div className={style.section}>
        <Textarea onChange={onTextChange} value={currentChild.text} />
      </div>

      <div className={style.section} id="value-section">
        <AtomBuilder event={currentChild} onEventChange={handleEventChange} />
      </div>
    </ScheduleItemCommonForm>
  );
};

export default observer(ScheduleEventsAdd);
