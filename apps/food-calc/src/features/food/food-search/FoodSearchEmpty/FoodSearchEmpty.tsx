import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { Button } from '@/shared/ui/atoms/Button';
import { QuietLabel, Text } from '@/shared/ui/atoms/Typography';
import styles from './FoodSearchEmpty.module.scss';

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

  // Равновесная пара: две одинаковые primary-secondary кнопки без иерархии (глагол
  // «Создать» несёт подсказка выше). `flat` — кнопки лежат НА поверхности дока как
  // часть смыслового блока (тень снята). createInputHtmlFor → кнопка рендерится как
  // <label htmlFor> (делегирование фокуса в create-input, паттерн ModalByLabel).
  const asTag = createInputHtmlFor ? 'label' : 'button';
  return (
    <div ref={ref} className={styles.root}>
      <div className={styles.header}>
        {showMessage && hasQuery && (
          <Text as="p" role="caption" className={styles.message}>
            По запросу <em>«{query}»</em> ничего нет
          </Text>
        )}
        <QuietLabel as="p" className={styles.prompt}>
          Нету нужной еды? Создать в два клика
        </QuietLabel>
      </div>
      <div className={styles.actions}>
        {onCreateDish && (
          <Button
            variant="primary-secondary"
            flat
            as={asTag}
            htmlFor={createInputHtmlFor}
            onClick={onCreateDish}
          >
            Блюдо
          </Button>
        )}
        {onCreateProduct && (
          <Button
            variant="primary-secondary"
            flat
            as={asTag}
            htmlFor={createInputHtmlFor}
            onClick={onCreateProduct}
          >
            Продукт
          </Button>
        )}
      </div>
    </div>
  );
};
