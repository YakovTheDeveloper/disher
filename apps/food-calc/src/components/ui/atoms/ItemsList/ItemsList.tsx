import { observer } from 'mobx-react-lite';
import styles from './ItemsList.module.scss';
import { useEffect, useMemo } from 'react';
import { ScheduleUIEventEmitter } from '@/components/blocks/builders/food/shared/emitter';
import { throttle } from '@/utils/throttle';
type Props = {
  children: React.ReactNode;
};

const ItemsList = ({ children }: Props) => {
  return <ul className={styles.container}>{children}</ul>;
};

export default observer(ItemsList);
