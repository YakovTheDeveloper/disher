import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import styles from './FoodSearchEmpty.module.scss';

const AppleIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M16.5 5.5c-1.6 0-3.3.9-4.5 2-1.2-1.1-2.9-2-4.5-2-3 0-5 2.2-5 5.8 0 4.6 3.8 8.7 9.5 8.7s9.5-4.1 9.5-8.7c0-3.6-2-5.8-5-5.8z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M13 4.5c.3-1.2 1.4-2 2.5-2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const BowlIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M3 12h18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M4 12c0 4.4 3.6 8 8 8s8-3.6 8-8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M9 4c0 .8-.7 1.3-.7 2.3s.7 1.4.7 2.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M12 3.5c0 .8-.7 1.3-.7 2.3s.7 1.4.7 2.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M15 4c0 .8-.7 1.3-.7 2.3s.7 1.4.7 2.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
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
      <AppleIcon />
      <span className={styles.pillTitle}>Нет нужного продукта?</span>
    </>
  );
  const dishContent = (
    <>
      <BowlIcon />
      <span className={styles.pillTitle}>Нет нужного блюда?</span>
    </>
  );

  return (
    <div ref={ref} className={styles.root}>
      {showMessage && hasQuery && (
        <p className={styles.message}>
          По запросу <em>«{query}»</em> ничего нет
        </p>
      )}
      <div className={styles.actions}>
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
      </div>
    </div>
  );
};
