import s from './AddPortionButton.module.scss';
import { PlusIcon } from '@/shared/ui/atoms/icons/PlusIcon';
import { Text } from '@/shared/ui/atoms/Typography';
import { PORTION_INPUT_IDS } from './usePortionFlow';

/**
 * Триггер создания порции — sky-pill в нижнем баре «Порции»-слайда. Заменяет
 * дублированную `.portionsBar`/`.addPortionButton` разметку, что жила на
 * ProductPage и DishBuilderPage. Рендерится как `<label htmlFor>` (focus-
 * делегация открывает шаг 1 модалки PortionCreateModals), а не `<button onClick>`.
 * Id инпута — статическая константа: Product/Dish на разных роутах, один инстанс.
 */
const AddPortionButton = () => (
  <div className={s.bar}>
    <label className={s.button} htmlFor={PORTION_INPUT_IDS.NAME_INPUT}>
      <span className={s.plus} aria-hidden="true">
        <PlusIcon />
      </span>
      <Text as="span" role="body">
        Добавить порцию
      </Text>
    </label>
  </div>
);

export default AddPortionButton;
