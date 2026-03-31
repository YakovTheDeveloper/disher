import styles from './SyncIndicator.module.scss';

export function SyncIndicator() {
  // LiveStore handles sync internally — no external status indicator needed
  return <div className={`${styles.indicator} ${styles.idle}`} />;
}
