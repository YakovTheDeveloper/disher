import styles from './FoodToolbar.module.scss';
import Button from '@/shared/ui/atoms/Button/Button';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { useUiStore } from '@/shared/model/uiStore';

type Props = {
  date?: string;
  hasItems: boolean;
};

const FoodToolbar = ({ date, hasItems }: Props) => {
  const { toScheduleAnalytics, toFood } = useAppRoutes();
  const showPrice = useUiStore((s) => s.scheduleFoodsShowPrice);
  const toggleShowPrice = useUiStore((s) => s.toggleScheduleFoodsShowPrice);

  return (
    <div className={styles.toolbar}>
      {hasItems && date && (
        <>
          <Button variant="ghost" onClick={() => toScheduleAnalytics(date)} className={styles.btn}>
            Анализ
          </Button>
          <span className={styles.divider} />
        </>
      )}
      <Button variant="ghost" onClick={toFood} className={styles.btn}>
        Список еды
      </Button>
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
    </div>
  );
};

export default FoodToolbar;
