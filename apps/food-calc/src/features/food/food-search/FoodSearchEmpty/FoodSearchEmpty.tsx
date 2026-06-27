import { useKeyboardStick } from '@/shared/ui/hooks/useKeyboardStick';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './FoodSearchEmpty.module.scss';

type Props = {
  onCreateProduct?: () => void;
  onCreateDish?: () => void;
  /**
   * If provided, the two actions render as <label htmlFor={createInputHtmlFor}>
   * so focus delegates to a create-name input elsewhere in the DOM. The
   * onCreateProduct / onCreateDish handlers still fire on click (e.g. to stash
   * the chosen variant in a draft) — step transitions happen via onFocusCapture
   * on the host. Without this prop the actions render as plain <button>.
   */
  createInputHtmlFor?: string;
};

export const FoodSearchEmpty = ({ onCreateProduct, onCreateDish, createInputHtmlFor }: Props) => {
  const ref = useKeyboardStick<HTMLDivElement>();

  const asTag = createInputHtmlFor ? 'label' : 'button';
  return (
    <div ref={ref} className={styles.root}>
      {/* Подсказка слева базовой типографикой, действия справа — равновесная
          строка без плавающих оверлеев. */}
      <Text as="p" role="body" className={styles.hint}>
        Не нашли еду?
      </Text>
      <div className={styles.actions}>
        {onCreateDish && (
          <Button
            variant="surface"
            onSurface={1}
            as={asTag}
            htmlFor={createInputHtmlFor}
            onClick={onCreateDish}
          >
            Блюдо
          </Button>
        )}
        {onCreateProduct && (
          <Button
            variant="surface"
            onSurface={1}
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
