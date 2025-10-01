import React from 'react';
import commonStyles from '../styles.module.scss';

import { observer } from 'mobx-react-lite';
import { DayScheduleUI } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
type Props<T> = {
  disabled?: boolean;
  content: { itemsLength: number };
  children?: string;
  onClick: () => void;
};
const FinishButton = <T,>({ content, disabled, children, onClick }: Props<T>) => {
  const isDisabled = disabled ?? content.itemsLength === 0;

  return (
    <button onClick={onClick} className={commonStyles.actionButton} disabled={isDisabled}>
      {children}
    </button>
  );
};

export default observer(FinishButton);
