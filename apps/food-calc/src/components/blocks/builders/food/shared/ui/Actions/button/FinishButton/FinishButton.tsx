import React from 'react';
import styles from './FinishButton.module.scss';
import { observer } from 'mobx-react-lite';
import { DayScheduleUI } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
type Props<T> = {
  onFinish: (payload: T) => Promise<void>;
  content: { id: number; payload: () => T; itemsLength: number };
};
const FinishButton = <T,>({ onFinish, content }: Props<T>) => {
  const id = content.id;

  const title = id === -1 ? 'Создать' : 'Обновить';

  const disabled = content.itemsLength === 0;

  const onClickHandler = () => onFinish(content.payload());

  return (
    <button onClick={onClickHandler} className={styles.container} disabled={disabled}>
      {title}
    </button>
  );
};

export default observer(FinishButton);
