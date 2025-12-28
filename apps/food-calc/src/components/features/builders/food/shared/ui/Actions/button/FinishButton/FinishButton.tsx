import React from 'react';
import commonStyles from '../styles.module.scss';

import { observer } from 'mobx-react-lite';
import { DayScheduleUI } from '@/components/features/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
type Props<T> = {
  disabled?: boolean;
  content: { itemsLength: number };
  children?: string;
  isShow?: () => boolean;
  onClick: () => void;
};
const FinishButton = <T,>({ content, disabled, children, onClick, isShow }: Props<T>) => {
  const isDisabled = disabled ?? content.itemsLength === 0;

  if (!isShow?.()) return null;

  return (
    <button onClick={onClick} className={commonStyles.actionButton} disabled={isDisabled}>
      {children}
    </button>
  );
};

export default observer(FinishButton);
