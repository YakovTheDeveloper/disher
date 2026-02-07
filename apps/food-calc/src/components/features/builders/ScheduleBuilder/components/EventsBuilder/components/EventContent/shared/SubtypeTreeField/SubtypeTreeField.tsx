import React from 'react';
import styles from './SubtypeTreeField.module.scss';
import clsx from 'clsx';
import { SubtypeTreeSelector } from '@/components/features/event/SubtypeTreeSelector';
import type { SubtypeOption } from '@/components/features/event/SubtypeTreeSelector';
import { EventSubtype } from '@/domain/schedule/scheduleEvent/eventTypes';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

type Props = {
  options: SubtypeOption[];
  subtype: string[];
  onChange: (value: EventSubtype[]) => void;
  maxDepth?: number;
  className?: string;
  error?: string;
};

const SubtypeTreeField = ({
  options,
  subtype,
  onChange,
  maxDepth = 3,
  className,
  error,
}: Props) => {
  const { t } = useTranslation();
  const isEmpty = subtype.length === 0;

  return (
    <div className={clsx(styles.container, className)}>
      {isEmpty && <div className={styles.placeholder}>{t('subtype.selectCategory')}</div>}
      <SubtypeTreeSelector
        options={options}
        selectedChain={subtype}
        maxDepth={maxDepth}
        onChange={onChange}
      />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default observer(SubtypeTreeField);
