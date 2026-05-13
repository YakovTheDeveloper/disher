import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import styles from './FoodSearchEmpty.module.scss';

const PlusIcon = () => (
  <svg
    viewBox="0 0 50 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={styles.plusIcon}
  >
    <mask id="fse-plus-mask" fill="white">
      <path d="M25 0C29.4183 1.93129e-07 33 3.58172 33 8V17H42C46.4183 17 50 20.5817 50 25C50 29.4183 46.4183 33 42 33H33V42C33 46.4183 29.4183 50 25 50C20.5817 50 17 46.4183 17 42V33H8C3.58172 33 0 29.4183 0 25C0 20.5817 3.58172 17 8 17H17V8C17 3.58172 20.5817 -1.93129e-07 25 0Z" />
    </mask>
    <path
      d="M25 0V-3V0ZM33 8H36V8L33 8ZM33 17H30V20H33V17ZM33 33V30H30V33H33ZM33 42H36V42H33ZM25 50V53V53V50ZM17 42H20V42H17ZM17 33H20V30H17V33ZM8 17V14H8L8 17ZM17 17V20H20V17H17ZM17 8H14V8H17ZM25 0V3C27.7614 3 30 5.23858 30 8H33L36 8C36 1.92487 31.0751 -3 25 -3V0ZM33 8H30V17H33H36V8H33ZM33 17V20H42V17V14H33V17ZM42 17V20C44.7614 20 47 22.2386 47 25H50H53C53 18.9249 48.0751 14 42 14V17ZM50 25H47C47 27.7614 44.7614 30 42 30V33V36C48.0751 36 53 31.0751 53 25H50ZM42 33V30H33V33V36H42V33ZM33 33H30V42H33H36V33H33ZM33 42H30C30 44.7614 27.7614 47 25 47V50V53C31.0751 53 36 48.0751 36 42H33ZM25 50V47C22.2386 47 20 44.7614 20 42H17H14C14 48.0751 18.9249 53 25 53V50ZM17 42H20V33H17H14V42H17ZM17 33V30H8V33V36H17V33ZM8 33V30C5.23858 30 3 27.7614 3 25H0H-3C-3 31.0751 1.92487 36 8 36V33ZM0 25H3C3 22.2386 5.23858 20 8 20V17L8 14C1.92487 14 -3 18.9249 -3 25H0ZM8 17V20H17V17V14H8V17ZM17 17H20V8H17H14V17H17ZM17 8H20C20 5.23858 22.2386 3 25 3V0V-3C18.9249 -3 14 1.92487 14 8H17Z"
      fill="currentColor"
      mask="url(#fse-plus-mask)"
    />
  </svg>
);

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

  const productContent = (
    <>
      <PlusIcon />
      <span className={styles.pillTitle}>Продукт</span>
    </>
  );
  const dishContent = (
    <>
      <PlusIcon />
      <span className={styles.pillTitle}>Блюдо</span>
    </>
  );

  return (
    <div ref={ref} className={styles.root}>
      {showMessage && hasQuery && (
        <p className={styles.message}>
          По запросу <em>«{query}»</em> ничего нет
        </p>
      )}
      <p className={styles.prompt}>Нету нужной еды? Создать в два клика</p>
      <div className={styles.actions}>
        {onCreateDish && (
          asLabel ? (
            <label
              htmlFor={createInputHtmlFor}
              className={styles.pillSecondary}
              onClick={onCreateDish}
            >
              {dishContent}
            </label>
          ) : (
            <button className={styles.pillSecondary} onClick={onCreateDish}>
              {dishContent}
            </button>
          )
        )}
        {onCreateProduct && (
          asLabel ? (
            <label
              htmlFor={createInputHtmlFor}
              className={styles.pillPrimary}
              onClick={onCreateProduct}
            >
              {productContent}
            </label>
          ) : (
            <button className={styles.pillPrimary} onClick={onCreateProduct}>
              {productContent}
            </button>
          )
        )}
      </div>
    </div>
  );
};
