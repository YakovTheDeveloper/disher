import React from 'react';
import commonStyles from '../styles.module.scss';

import { observer } from 'mobx-react-lite';
import { DayScheduleUI } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
type Props<T> = {
  onFinish: (payload: T) => Promise<void>;
  content: { id: number; payload: () => T; itemsLength: number };
};
const FinishButton = <T,>({ onFinish, content }: Props<T>) => {
  const id = content.id;

  const title = id === -1 ? 'обновить' : 'обновить';

  const disabled = content.itemsLength === 0;

  const onClickHandler = () => onFinish(content.payload());

  return (
    <button onClick={onClickHandler} className={commonStyles.actionButton} disabled={disabled}>
      {title}
    </button>
  );
};

export default observer(FinishButton);
