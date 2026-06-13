import type { ReactNode } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';

/**
 * ModalByLabelDetails — единая «обвязка экрана» модалки особенностей/деталей,
 * общая для FoodSchedule (HomePage) и DishItem (DishPage), на create- и
 * edit-флоу. Владеет порталом (ModalByLabel), визуальной рамкой (ModalShell),
 * шапкой и кнопкой «Готово». Само поле деталей — `DetailsStep` или
 * `DetailsChips` — каждый консумер передаёт через `children` (placeholder,
 * productId и подсказки остаются заботой конкретной сущности).
 *
 * Шапка — два режима, разведённые типами (title XOR header):
 *  - edit (тап по названию сущности): `title` = название продукта + `onBack`
 *    (+ опц. `trailing`, напр. кнопка «ⓘ»). Рисуется `ModalShell.Header`.
 *  - create (шаг флоу): `header` = готовый элемент `ModalShell.StepHeader`
 *    (хлебные крошки шагов). `title` в create-флоу НЕ передаётся.
 */
type BaseProps = {
  isExpanded: boolean;
  onCommit: () => void;
  /** Поле деталей: `DetailsStep` (schedule) или `DetailsChips` (dish). */
  children: ReactNode;
  position?: 'fixed' | 'absolute';
  /** Vestigial — ModalShell ignores it (tone is the global law-giver). */
  variant?: string;
  /** Body вплотную к краям (schedule). Dish — без flush. */
  flush?: boolean;
  /** data-debug-id для ActionButtons (schedule create → "create-details"). */
  debugId?: string;
};

type EditHeaderProps = {
  /** edit: название продукта в шапке. */
  title: string;
  onBack: () => void;
  trailing?: ReactNode;
  header?: never;
};

type StepHeaderProps = {
  /** create: готовый <ModalShell.StepHeader …/>. */
  header: ReactNode;
  title?: never;
  onBack?: never;
  trailing?: never;
};

export type ModalByLabelDetailsProps = BaseProps & (EditHeaderProps | StepHeaderProps);

export function ModalByLabelDetails({
  isExpanded,
  onCommit,
  children,
  position = 'absolute',
  variant = 'spring2',
  flush,
  debugId,
  title,
  onBack,
  trailing,
  header,
}: ModalByLabelDetailsProps) {
  return (
    <ModalByLabel
      position={position}
      isExpanded={isExpanded}
      content={
        <ModalShell variant={variant}>
          {title !== undefined ? (
            <ModalShell.Header title={title} onBack={onBack} trailing={trailing} />
          ) : (
            header
          )}
          <ModalShell.Body flush={flush}>
            {children}
            <ModalShell.ActionButtons
              debugId={debugId}
              right={<ModalNextButton onClick={onCommit} variant="finish" />}
            />
          </ModalShell.Body>
        </ModalShell>
      }
    />
  );
}

export default ModalByLabelDetails;
