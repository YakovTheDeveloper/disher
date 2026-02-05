import { observer } from 'mobx-react-lite';
import styles from './EventContent.module.scss';
import { Instance } from 'mobx-state-tree';
import { ScheduleEventItem } from '@/domain/schedule/scheduleEvent/ScheduleEvent.model';
import FormRenderer from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/EventContent/shared/FormRenderer/FormRenderer';
import { useCallback } from 'react';
import { useEventValidation } from '@/hooks/useEventValidation';

type Props = {
  onFinish: () => void;
  currentEvent: Instance<typeof ScheduleEventItem>;
};

const EventContentV2 = observer(({ currentEvent, onFinish }: Props) => {
  // const { validation } = useEventValidation(data, config);

  const config = currentEvent.formConfig;

  // const handleChange = (newValue: string) => {
  //   currentEvent.updateValue(newValue);
  // };

  const data = currentEvent.data;
  const updateField = useCallback(
    (field: string, value: number | string | string[] | undefined) => {
      if (data?.[field] === value) return;

      const newData = { ...data, [field]: value };
      currentEvent.setData(newData);
    },
    [currentEvent, data]
  );

  const handleSubmit = () => {
    // if (selected === 'digestion') return;
    onFinish();
  };

  // const handleDigestionSave = () => {
  //   onFinish();
  // };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <FormRenderer
          config={config.fields}
          values={data as Record<string, string | number | string[]>}
          onChange={updateField}
          errors={{}}
        />
      </form>
    </div>
  );
});

export default EventContentV2;
