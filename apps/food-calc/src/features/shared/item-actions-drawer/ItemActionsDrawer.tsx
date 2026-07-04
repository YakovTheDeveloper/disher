import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Button, IconButton, type ButtonVariant } from '@/shared/ui/atoms/Button';
import { ActionTile } from '@/shared/ui/atoms/ActionTile';
import type { BaseDrawerProps } from '@/shared/ui';
import s from './ItemActionsDrawer.module.scss';

export type ItemAction = {
  label: string;
  icon?: React.ReactNode;
  /**
   * Гравюра (public/art) для art-слота плитки в ряду правок (editActions). Ряд
   * правок рендерится квадратными `ActionTile` (muted-серый вариант) — гравюра
   * втекает в правый край плитки, глиф-иконки там больше не используются.
   */
  art?: React.ReactNode;
  onClick: () => void;
  /**
   * Тон кнопки в стеке (переиспользует словарь примитива, без отдельного
   * `emphasis`-enum). Дефолт — тихий `system-secondary`; «главное» действие
   * (напр. «Информация о продукте») помечается `'system'` (уголь-filled) и
   * читается как акцент стека.
   */
  variant?: ButtonVariant;
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
            variant={action.variant ?? 'system-secondary'}
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
          <div className={s.editRow}>
            {editActions.map((action, i) => (
              <ActionTile
                key={`${action.label}-${i}`}
                className={s.editTile}
                emphasis
                top={action.label}
                art={action.art}
                onClick={() => handleAction(action)}
              />
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
