import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
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
  const asLabel = Boolean(createInputHtmlFor);

  // Независимый press-отклик на каждую кнопку (один общий хук подсветил бы обе).
  const dishPress = usePressFeedback();
  const productPress = usePressFeedback();

  const productContent = (
    <>
      <img src={PRODUCT_IMG} className={styles.tileImg} alt="" aria-hidden />
      <span className={styles.pillTitle}>
        <span className={styles.pillVerb}>Создать</span>
        <span className={styles.pillNoun}>Продукт</span>
      </span>
    </>
  );
  const dishContent = (
    <>
      <img src={DISH_IMG} className={styles.tileImg} alt="" aria-hidden />
      <span className={styles.pillTitle}>
        <span className={styles.pillVerb}>Создать</span>
        <span className={styles.pillNoun}>Блюдо</span>
      </span>
    </>
  );

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
        {onCreateDish &&
          (asLabel ? (
            <label
              htmlFor={createInputHtmlFor}
              className={styles.pillSecondary}
              onClick={onCreateDish}
              data-pressed={dishPress.pressed || undefined}
              {...dishPress.pressProps}
            >
              {dishContent}
            </label>
          ) : (
            <button
              className={styles.pillSecondary}
              onClick={onCreateDish}
              data-pressed={dishPress.pressed || undefined}
              {...dishPress.pressProps}
            >
              {dishContent}
            </button>
          ))}
        {onCreateProduct &&
          (asLabel ? (
            <label
              htmlFor={createInputHtmlFor}
              className={styles.pillPrimary}
              onClick={onCreateProduct}
              data-pressed={productPress.pressed || undefined}
              {...productPress.pressProps}
            >
              {productContent}
            </label>
          ) : (
            <button
              className={styles.pillPrimary}
              onClick={onCreateProduct}
              data-pressed={productPress.pressed || undefined}
              {...productPress.pressProps}
            >
              {productContent}
            </button>
          ))}
      </div>
    </div>
  );
};
