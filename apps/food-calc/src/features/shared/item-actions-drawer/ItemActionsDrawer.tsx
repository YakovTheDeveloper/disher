import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Button, IconButton, type ButtonVariant } from '@/shared/ui/atoms/Button';
import type { BaseDrawerProps } from '@/shared/ui';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import s from './ItemActionsDrawer.module.scss';

// Сливовая (plum) расцветка ряда правок — 6 форков, играем осями заливка/рамка/
// текст+иконка. Форк-SCSS в ItemActionsDrawer.module.scss бьёт по [data-dv-v],
// перекрывая опубликованные Button'ом --sec-* локали. Дефолт (index 0) =
// plum-soft: тональная сливовая заливка без рамки.
const PLUM_EDIT_VARIANTS = [
  'plum-soft', // тональная лиловая заливка, без рамки
  'plum-outline', // прозрачный фон + сливовая рамка (воздушный)
  'plum-soft-border', // заливка + рамка (и то, и другое)
  'plum-deep', // плотнее хрома заливки, глубже ink
  'plum-frame', // бледный фон + сильная 1.5px рамка (frame-forward)
  'plum-bold', // сплошной глубокий plum + светлый текст (инверсия)
] as const;

export type ItemAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  /**
   * Тон кнопки в стеке (переиспользует словарь примитива, без отдельного
   * `emphasis`-enum). Дефолт — тихий `system-secondary`; «главное» действие
   * (напр. «Информация о продукте») помечается `'system'` (уголь-filled) и
   * читается как акцент стека.
   */
  variant?: ButtonVariant;
  /**
   * Если задан, кнопка рендерится как `<label htmlFor={htmlFor}>` (делегация
   * фокуса ModalByLabel) вместо обычной `<button>`: тап фокусирует целевой input
   * → хостовый `onFocusCapture` флипает нужный шаг edit-флоу, и iOS Safari
   * поднимает клавиатуру (императивный `.focus()` из клика по кнопке этого не
   * даёт). В этом режиме `onClick` ТОЛЬКО праймит состояние (напр. `primeEdit(
   * item)`) — он НЕ закрывает дровер и НЕ сетит шаг: иначе label размонтируется
   * до делегирования фокуса, а шаг погонится с focus-событием (см. CLAUDE.md
   * «Label focus delegation»). Дровер закрывается сам по уходу фокуса наружу.
   * Опускай для действий, которые навигируют/открывают (они закрываются-и-
   * выполняются через обычную кнопку).
   */
  htmlFor?: string;
};

interface Props extends BaseDrawerProps<void> {
  /** Entity display name shown above the action stack (product / dish / event text). */
  title?: string;
  /** Destructive — rendered in DrawerLayout's top-right chrome slot, opposite the
   *  top-left close cross and away from the action stack, so a casual tap toward
   *  the actions can't hit it. One tap deletes (no extra confirm — placement is
   *  the guard). Omit for non-deletable entities (e.g. catalog foods) → the trash
   *  chrome button is dropped and the drawer shows actions only. */
  onDelete?: () => void;
  /** Bottom vertical stack. The last entry reads as the "primary" action
   *  (e.g. «Информация о продукте» sits at the bottom). */
  actions: ItemAction[];
  editActions?: ItemAction[];
}

// Each handler closes the drawer FIRST, then runs the callback. Order matters:
// an info-action that navigates must not leave the drawer mounted over the new
// page (see spec Edge cases).
export const ItemActionsDrawer = ({ onClose, title, onDelete, actions, editActions }: Props) => {
  const editVariant = useDesignVariant('ItemActionsEdit', PLUM_EDIT_VARIANTS);

  const handleDelete = () => {
    onClose();
    onDelete?.();
  };

  const handleAction = (action: ItemAction) => {
    onClose();
    action.onClick();
  };

  return (
    <DrawerLayout
      title={title}
      a11yLabel={title ?? 'Действия'}
      topRight={
        onDelete ? (
          <IconButton
            tone="danger"
            className={s.deleteBtn}
            onClick={handleDelete}
            aria-label="Удалить"
            icon={<TrashIcon />}
          />
        ) : undefined
      }
    >
      <div className={s.actions}>
        {actions.map((action, i) => (
          <Button
            key={`${action.label}-${i}`}
            variant={'system-secondary'}
            flat
            fullWidth
            icon={action.icon}
            onClick={() => handleAction(action)}
          >
            <span className={s.editBtnLabel}>{action.label}</span>
          </Button>
        ))}
      </div>
      {editActions && editActions.length > 0 && (
        <div className={s.editSection}>
          <div className={s.editRow} {...editVariant.anchor}>
            {editActions.map((action, i) => (
              <Button
                key={`${action.label}-${i}`}
                className={s.editBtn}
                variant="system-secondary"
                trailingIcon={action.icon}
                // htmlFor → label-режим: тап фокусирует целевой input, хостовый
                // onFocusCapture флипает шаг (iOS поднимает клавиатуру). onClick
                // только праймит (primeEdit) — НЕ closes/setStep, иначе label
                // размонтируется до делегирования фокуса (CLAUDE.md «Label focus
                // delegation»); дровер закроется сам по уходу фокуса. Без htmlFor
                // — обычная кнопка: закрыть-и-выполнить (навигация).
                {...(action.htmlFor
                  ? { as: 'label' as const, htmlFor: action.htmlFor, onClick: action.onClick }
                  : { onClick: () => handleAction(action) })}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </DrawerLayout>
  );
};

const TrashIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
