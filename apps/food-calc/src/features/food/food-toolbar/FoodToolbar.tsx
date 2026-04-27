import styles from './FoodToolbar.module.scss';
import Button from '@/shared/ui/atoms/Button/Button';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { useUiStore } from '@/shared/model/uiStore';
import toaster from '@/shared/lib/toaster/toaster';

type Props = {
  variant: 'schedule' | 'dishes';
  date?: string;
  hasItems: boolean;
  onSuggest?: () => void;
};

const FoodToolbar = ({ variant, date, hasItems, onSuggest }: Props) => {
  const { toScheduleAnalytics } = useAppRoutes();
  const showPrice = useUiStore((s) => s.scheduleFoodsShowPrice);
  const toggleShowPrice = useUiStore((s) => s.toggleScheduleFoodsShowPrice);

  const handleAnalytics = () => {
    if (variant === 'schedule' && date) {
      toScheduleAnalytics(date);
    } else {
      toaster.info('Не реализовано');
    }
  };

  return (
    <div className={styles.toolbar}>
      {hasItems && (
        <>
          <Button variant="ghost" onClick={handleAnalytics} className={styles.btn}>
            Анализ
          </Button>
          <span className={styles.divider} />
        </>
      )}
      {hasItems && (
        <>
          <span className={styles.divider} />
          <Button
            variant="ghost"
            onClick={toggleShowPrice}
            className={styles.btn}
            style={{ opacity: showPrice ? 1 : 0.4 }}
          >
            ₽
          </Button>
        </>
      )}
      {onSuggest && (
        <>
          <span className={styles.divider} />
          <Button variant="ghost" onClick={onSuggest} className={styles.btn}>
            Предложить
          </Button>
        </>
      )}
    </div>
  );
};

export default FoodToolbar;
