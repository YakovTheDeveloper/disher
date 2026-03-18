import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ModalLayout } from '@/components/features/builders/shared/components/ModalLayout';
import { ScheduleSelection } from '@/components/features/ScheduleSelection';
import { BaseModalProps } from '@/shared/ui';
import Toggle from '@/components/features/builders/shared/ui/Toggle/Toggle';

type Mode = 'copy' | 'move';

interface Props extends BaseModalProps<{ date: string; mode: Mode }> {
  title?: string;
  defaultMode?: Mode;
}

const ModalCopyScheduleFoodsToAnotherDay = observer(
  ({ title, defaultMode = 'copy', onClose }: Props) => {
    const [mode, setMode] = useState<Mode>(defaultMode);

    const handleSelect = (date: string) => {
      onClose({ date, mode });
    };

    const handleModeChange = (checked: boolean) => {
      setMode(checked ? 'move' : 'copy');
    };

    const headerText =
      mode === 'copy'
        ? 'Скопировать приёмы пищи на другой день'
        : 'Переместить приёмы пищи на другой день';

    return (
      <ModalLayout>
        <h2>{title || headerText}</h2>
        <div style={{ marginBottom: 16 }}>
          <Toggle
            checked={mode === 'move'}
            onChange={handleModeChange}
            labels={{ on: 'Переместить', off: 'Копировать' }}
          />
        </div>
        <ScheduleSelection onSelect={handleSelect} />
      </ModalLayout>
    );
  }
);

export default ModalCopyScheduleFoodsToAnotherDay;
