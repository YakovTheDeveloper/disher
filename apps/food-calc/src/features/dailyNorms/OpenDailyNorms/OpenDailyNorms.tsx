import { useCallback } from 'react';
import { useHasUserNorm, USER_NORM_NAME } from '@/entities/daily-norm';
import { modalStore } from '@/shared/ui';
import CreateDailyNormModal from './CreateDailyNormModal';
import EditDailyNormModal from './EditDailyNormModal';
import styles from './OpenDailyNorms.module.scss';

type Props = {
  className?: string;
};

const OpenDailyNorms = ({ className }: Props) => {
  const hasNorm = useHasUserNorm();

  const handleClick = useCallback(() => {
    if (hasNorm) {
      void modalStore.show(EditDailyNormModal, {});
    } else {
      void modalStore.show(CreateDailyNormModal, {});
    }
  }, [hasNorm]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${styles.container} ${className ?? ''}`}
    >
      <span className={styles.button}>
        {hasNorm ? USER_NORM_NAME : 'Настроить норму'}
      </span>
      <span className={styles.descriptionLabel}>дневная норма</span>
      <span className={styles.decorative}>%</span>
    </button>
  );
};

export default OpenDailyNorms;
