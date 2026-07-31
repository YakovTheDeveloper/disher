import { useEffect, useMemo, useRef, useState } from 'react';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { NutrientCompositionEditor } from '@/features/food/nutrient-composition-editor';
import { SuggestActionButton } from '@/shared/ui/SuggestActionButton';
import { Text } from '@/shared/ui/atoms/Typography';
import { formatAmount } from '@/shared/lib/formatNumber';
import { useProduct, useProductNutrients, setProductNutrients } from '@/entities/product';
import { allNutrientsList } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { safeMutate } from '@/shared/lib/safeMutate';
import type { BaseModalProps } from '@/shared/ui/overlay-types';
import s from './EditNutrientsModal.module.scss';

const gramNutrientIds = new Set(allNutrientsList.filter((n) => n.unit === 'g').map((n) => n.id));

interface Props extends BaseModalProps<void> {
  productId: string;
  /**
   * Деструктивный AI-подбор всего состава (whole-replace за confirm-гейтом).
   * Пишет в Dexie сам (на стороне страницы); модалка подхватывает результат
   * через live-query. Не задан → кнопка не рисуется.
   */
  onResuggest?: () => void | Promise<void>;
}

/**
 * Fullscreen-редактор нутриентов своего продукта. Открывается через
 * `modalStore.show(EditNutrientsModal, { productId, … })` — канон ModalLayout +
 * ModalShell, как DailyNormModal. Тело — `NutrientCompositionEditor`, та же
 * секция состава, что в форме создания продукта (SearchFood).
 *
 * Семантика draft + confirm: правки копятся в локальном draft и пишутся в
 * Dexie ОДИН раз по «Сохранить» (keystroke-запись давала whole-replace на
 * каждый символ — промежуточный «0» при вводе «0.5» удалял ключ). Отмена
 * (onBack/крест) выбрасывает draft без записи.
 */
export const EditNutrientsModal = ({ onClose, productId, onResuggest }: Props) => {
  const { results: nutrientsRaw } = useProductNutrients(productId);
  const food = useProduct(productId);

  const [draft, setDraft] = useState<Record<string, number>>({});
  const [suggesting, setSuggesting] = useState(false);
  // «Юзер тронул поле» — после этого draft главнее live-query.
  const dirtyRef = useRef(false);

  // Правило синка draft: пока юзер ничего не менял, draft пересобирается из
  // live-query — так AI-переподбор (пишет в Dexie сам) появляется в модалке.
  // Как только тронуто любое поле, внешние изменения игнорируем до confirm/отмены.
  useEffect(() => {
    if (dirtyRef.current) return;
    const next: Record<string, number> = {};
    for (const n of nutrientsRaw) next[n.nutrientId] = n.quantity;
    setDraft(next);
  }, [nutrientsRaw]);

  // Спиннер «Подбираем…» гасим, когда AI-запись доехала через live-query;
  // на ошибке запроса состав не меняется — гасим по reject промиса.
  const nutrientsRef = useRef(nutrientsRaw);
  useEffect(() => {
    if (nutrientsRef.current !== nutrientsRaw) {
      nutrientsRef.current = nutrientsRaw;
      setSuggesting(false);
    }
  }, [nutrientsRaw]);

  // Правка — только в draft; 0 НЕ удаляет ключ здесь (юзер может быть на
  // середине ввода «0.5»), зачистка нулей — при сериализации на confirm.
  const handleValueChange = (nutrientId: string, value: number) => {
    dirtyRef.current = true;
    setDraft((prev) => ({ ...prev, [nutrientId]: value }));
  };

  const handleSuggest = () => {
    if (!onResuggest) return;
    setSuggesting(true);
    void Promise.resolve(onResuggest()).catch(() => setSuggesting(false));
  };

  const handleSave = () => {
    const clean: Record<string, number> = {};
    for (const [nutrientId, value] of Object.entries(draft)) {
      if (value !== 0) clean[nutrientId] = value;
    }
    void safeMutate(
      () => setProductNutrients(productId, JSON.stringify(clean)),
      'Не удалось сохранить нутриенты'
    );
    onClose();
  };

  // Warning «масса > 100 г» считается из draft (реагирует на ещё не сохранённые
  // правки); только для basis '100g' — у добавок масса порции не ограничена.
  const massWarningGrams = useMemo(() => {
    if (food?.servingBasis !== '100g') return null;
    let sum = 0;
    for (const [nutrientId, value] of Object.entries(draft)) {
      if (gramNutrientIds.has(nutrientId)) sum += value;
    }
    return sum > 100 ? sum : null;
  }, [food?.servingBasis, draft]);

  return (
    <ModalLayout a11yLabel="Редактировать нутриенты">
      <ModalShell variant="spring2">
        <ModalShell.Header title="Редактировать нутриенты" onBack={() => onClose()} />
        <ModalShell.Body>
          {onResuggest && (
            <div className={s.suggestRow}>
              <SuggestActionButton
                label={suggesting ? 'Подбираем…' : 'Переподобрать состав'}
                onClick={handleSuggest}
                disabled={suggesting}
              />
            </div>
          )}
          {massWarningGrams != null && (
            <div className={s.massWarning} role="status">
              <Text as="span" role="caption">
                Совокупная масса нутриентов ({formatAmount(massWarningGrams)} г) превышает 100 г
              </Text>
            </div>
          )}
          <NutrientCompositionEditor values={draft} onChange={handleValueChange} />
          <ModalShell.Spacer />
          <ModalShell.ActionButtons
            debugId="edit-nutrients"
            right={<ModalNextButton variant="finish" label="Сохранить" onClick={handleSave} />}
          />
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default EditNutrientsModal;
