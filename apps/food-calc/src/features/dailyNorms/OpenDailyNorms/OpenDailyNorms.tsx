import { useCallback } from 'react';
import { useHasUserNorm, USER_NORM_NAME } from '@/entities/daily-norm';
import { modalStore } from '@/shared/ui';
import CreateDailyNormModal from './CreateDailyNormModal';
import EditDailyNormModal from './EditDailyNormModal';
import FlagIcon from '@/shared/assets/icons/flag.svg?react';
import styles from './OpenDailyNorms.module.scss';

type Props = {
  className?: string;
  /**
   * 'card' (default) — большая карточка с названием нормы + декоративный «%».
   * 'icon' — компактная icon-only кнопка с флажком (для hero-блоков
   * страниц продукта/блюда, где норма не должна конкурировать с quantity).
   */
  variant?: 'card' | 'icon';
};

const OpenDailyNorms = ({ className, variant = 'card' }: Props) => {
  const hasNorm = useHasUserNorm();

  const handleClick = useCallback(() => {
    if (hasNorm) {
      void modalStore.show(EditDailyNormModal, {});
    } else {
      void modalStore.show(CreateDailyNormModal, {});
    }
  }, [hasNorm]);

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${styles.iconButton} ${className ?? ''}`}
        aria-label={hasNorm ? 'Изменить дневную норму' : 'Настроить дневную норму'}
      >
        <FlagIcon width={18} height={18} />
      </button>
    );
  }

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
