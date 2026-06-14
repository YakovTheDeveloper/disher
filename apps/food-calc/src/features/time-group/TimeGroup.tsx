import styles from './TimeGroup.module.scss';

import { memo } from 'react';
import { motion } from 'motion/react';
import { TimeGroupUI } from '@/shared/lib/schedule';

type Props<T> = {
  children: React.ReactNode;
  group: TimeGroupUI<T>;
};

// Wraps a cluster of same-time schedule rows (Food + Events). The time-group
// header — the time label above each cluster — was retired 2026-06-14: its only
// shipped look was the `hidden` design-variant (production default rendered
// `.header { display: none }`), so it's dropped entirely, along with its
// per-row-time toggle. `group` stays in the props so callers can key/group by it.
const TimeGroup = <T,>({ children }: Props<T>) => {
  return <motion.ul className={styles.container}>{children}</motion.ul>;
};

export default memo(TimeGroup) as typeof TimeGroup;
