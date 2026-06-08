import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { NutrientTable } from '@/widgets/nutrients/FoodsNutrients';
import s from './EditNutrientsModal.module.scss';

interface Props {
  isExpanded: boolean;
  onClose: () => void;
  /** База состава (per-100 г / per-1 шт), НЕ скейленная. */
  getValue: (nutrientId: string) => number;
  onValueChange: (nutrientId: string, value: number) => void;
  /**
   * Совокупная масса грамм-нутриентов, когда она > 100 г (показать warning).
   * `null` — не показывать (добавка / в норме). Только для basis '100g'.
   */
  massWarningGrams: number | null;
}

/**
 * Fullscreen-редактор нутриентов своего продукта. Страница продукта по
 * умолчанию — режим просмотра (read-only скейл по количеству); правка базы
 * состава живёт здесь, по канону ModalByLabel + ModalShell (как ChangeNameModal).
 */
export const EditNutrientsModal = ({
  isExpanded,
  onClose,
  getValue,
  onValueChange,
  massWarningGrams,
}: Props) => (
  <ModalByLabel
    position="fixed"
    isExpanded={isExpanded}
    content={
      <ModalShell variant="spring2">
        <ModalShell.Header title="Редактировать нутриенты" onBack={onClose} />
        <ModalShell.Body>
          {massWarningGrams != null && (
            <div className={s.massWarning} role="status">
              Совокупная масса нутриентов ({massWarningGrams.toFixed(1)} г) превышает 100 г
            </div>
          )}
          <NutrientTable
            getValue={getValue}
            variant="edit-values"
            onValueChange={onValueChange}
          />
        </ModalShell.Body>
      </ModalShell>
    }
  />
);

export default EditNutrientsModal;
