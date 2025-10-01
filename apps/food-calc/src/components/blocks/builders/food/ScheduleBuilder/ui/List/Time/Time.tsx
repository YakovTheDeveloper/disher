import { observer } from 'mobx-react-lite';
import { motion } from 'framer-motion';
import styles from './Time.module.scss';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAnimationOnChange } from '@/components/blocks/builders/food/shared/hooks/useAnimationOnChange';

type Props = {
  children: () => string | null;
  onClick: (id: number | string) => void;
  id: number | string;
};

const Time = ({ children, id, onClick }: Props) => {
  const onClickHandler = () => onClick(id);

  const className = useAnimationOnChange(children());

  return (
    <p onClick={onClickHandler} className={clsx([className, styles.container])}>
      {children()}
    </p>
  );
};

export default observer(Time);
