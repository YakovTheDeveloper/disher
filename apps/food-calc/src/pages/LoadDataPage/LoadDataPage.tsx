import styles from './LoadDataPage.module.scss';

type Props = {
  children?: React.ReactNode;
};

/**
 * LoadDataPage is no longer needed with Triplit — data loading is handled
 * automatically by the Triplit client with offline-first IndexedDB storage.
 * This component is kept as a minimal placeholder for route compatibility.
 */
const LoadDataPage = ({}: Props) => {
  return (
    <div className={styles.container}>
      <h1>Loading Application Data...</h1>
      <div>All data loaded</div>
    </div>
  );
};

export default LoadDataPage;
