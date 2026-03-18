import { useNavigate } from 'react-router';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { ScheduleFoodCommonForm } from '@/components/features/builders/ScheduleBuilder/components/layout/ScheduleItemCommonForm';
import Button from '@/components/ui/atoms/Button/Button';
import style from './ScheduleEventsAdd.module.scss';
import Textarea from '@/components/ui/atoms/Textarea/Textarea';
import { AtomBuilder } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/AtomBuilder';
import { scrollToElement } from '@/lib/scroll';
import { TimeChoose } from '@/components/ui/TimeChoose';

interface ScheduleEventsAddProps {
  scheduleStore?: any; // TODO: replace with Triplit mutation hooks
  scheduleChildItem: any; // TODO: type as event draft
  parentScheduleId: string;
}

const ScheduleEventsAdd = (props: ScheduleEventsAddProps) => {
  const navigate = useNavigate();

  const { parentScheduleId, scheduleChildItem: currentChild, scheduleStore } = props;

  const handleFinish = () => {
    scheduleStore?.commitEventDraft(parentScheduleId);
    navigate(-1);
  };

  const handleTimeFinish = (time: string) => {
    currentChild.updateTime(time);
    // Auto-scroll to next section
    document.activeElement?.blur(); // Dismiss keyboard on mobile
    scrollToElement('schedule-item-form', 'event-type-section', { behavior: 'auto', delay: 100 });
  };

  const handleEventTypeFinish = () => {
    scrollToElement('schedule-item-form', 'value-section', { behavior: 'smooth' });
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
    <ScheduleFoodCommonForm
      time={currentChild.time}
      button={
        <Button variant="primary" onClick={handleFinish}>
          Сохранить
        </Button>
      }
    >
      <div className={style.section} id="time-section">
        <TimeChoose onFinish={handleTimeFinish} initialTime={currentChild.time} />
      </div>
      <div className={style.section}>
        <Textarea onChange={onTextChange} value={currentChild.text} />
      </div>

      <div className={style.section} id="value-section">
        <AtomBuilder event={currentChild} onEventChange={handleEventChange} />
      </div>
    </ScheduleFoodCommonForm>
  );
};

export default ScheduleEventsAdd;
