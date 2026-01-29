import { observer } from 'mobx-react-lite';
import styles from './FormCreateEntityWithName.module.scss';
import { useRef } from 'react';
import { TextInput } from '@/components/ui/atoms/input/TextInput';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { Button } from '@/components/ui/atoms/Button';
import { Label } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/EventContent/shared/Label';

type Props = {
  title?: string;
  buttonText?: string;
  onFinish: (name: string) => void;
};

const FormCreateEntityWithName = ({
  title = 'Создать новый продукт',
  buttonText = 'Создать',
  onFinish,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form className={styles.container} onClick={(e) => e.stopPropagation()}>
      <p>{title}</p>
      <Label aside={<ScreenLabel variant="formValueLabel">Создать</ScreenLabel>}>
        <TextInput ref={inputRef} placeholder="Например, креветка" size="large" />
      </Label>
      <Button
        onClick={() => {
          onFinish(inputRef.current?.value.trim() || 'Без имени');
        }}
      >
        {buttonText}
      </Button>
    </form>
  );
};

export default observer(FormCreateEntityWithName);
