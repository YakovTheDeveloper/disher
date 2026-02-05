import React from 'react';
import styles from './SubtypeTreeField.module.scss';
import clsx from 'clsx';
import {
  SubtypeTreeSelector,
  SubtypeOption,
} from '@/components/features/event/SubtypeTreeSelector';
import { EventSubtype } from '@/domain/schedule/scheduleEvent/eventTypes';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

type Props = {
  options: SubtypeOption[];
  value: EventSubtype[];
  onChange: (value: EventSubtype[]) => void;
  label?: string;
  maxDepth?: number;
  className?: string;
  error?: string;
};

const SubtypeTreeField = ({
  options,
  value,
  onChange,
  label,
  maxDepth = 3,
  className,
  error,
}: Props) => {
  const { t } = useTranslation();
  const isEmpty = value.length === 0;

  return (
    <div className={clsx(styles.container, className)}>
      {label && <div className={styles.label}>{label}</div>}
      {isEmpty && <div className={styles.placeholder}>{t('subtype.selectCategory')}</div>}
      <SubtypeTreeSelector
        options={options}
        selectedChain={value}
        maxDepth={maxDepth}
        onChange={onChange}
      />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default observer(SubtypeTreeField);
