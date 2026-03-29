import styles from './NowMarker.module.scss';

const NowMarker = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  return (
    <div className={styles.marker}>
      <span className={styles.label}>сейчас {hours}:{minutes}</span>
      <div className={styles.line} />
    </div>
  );
};

export default NowMarker;
