import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { ActionTile } from '@/shared/ui/atoms/ActionTile';
import styles from './FoodSearchEmpty.module.scss';

const PRODUCT_IMG = '/art/product.png';
const DISH_IMG = '/art/dish.png';

type Props = {
  query: string;
  onCreateProduct?: () => void;
  onCreateDish?: () => void;
  showMessage?: boolean;
  /**
   * If provided, the two actions render as <label htmlFor={createInputHtmlFor}>
   * so focus delegates to a create-name input elsewhere in the DOM. The
   * onCreateProduct / onCreateDish handlers still fire on click (e.g. to stash
   * the chosen variant in a draft) — step transitions happen via onFocusCapture
   * on the host. Without this prop the actions render as plain <button>.
   */
  createInputHtmlFor?: string;
};

export const FoodSearchEmpty = ({
  query,
  onCreateProduct,
  onCreateDish,
  showMessage = true,
  createInputHtmlFor,
}: Props) => {
  const ref = useKeyboardStick<HTMLDivElement>();
  const hasQuery = query.length > 0;

  // Равновесная пара: оба слова существительные (noun сверху, «Создать» снизу),
  // без primary/secondary иерархии. createInputHtmlFor → плитка рендерится как
  // <label htmlFor> (делегирование фокуса в create-input).
  return (
    <div ref={ref} className={styles.root}>
      <div className={styles.header}>
        {showMessage && hasQuery && (
          <p className={styles.message}>
            По запросу <em>«{query}»</em> ничего нет
          </p>
        )}
        <p className={styles.prompt}>Нету нужной еды? Создать в два клика</p>
      </div>
      <div className={styles.actions}>
        {onCreateDish && (
          <ActionTile
            htmlFor={createInputHtmlFor}
            top="Блюдо"
            bottom="Создать"
            art={<img src={DISH_IMG} alt="" />}
            onClick={onCreateDish}
          />
        )}
        {onCreateProduct && (
          <ActionTile
            htmlFor={createInputHtmlFor}
            top="Продукт"
            bottom="Создать"
            art={<img src={PRODUCT_IMG} alt="" />}
            onClick={onCreateProduct}
          />
        )}
      </div>
    </div>
  );
};
