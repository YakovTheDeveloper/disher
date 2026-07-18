import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { IconButton } from '@/shared/ui/atoms/Button';
import { RoundButton } from '@/shared/ui/RoundButton';
import { Well } from '@/shared/ui/Well';
import { ActionList } from '@/shared/ui/ActionList';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import type { BaseDrawerProps } from '@/shared/ui';
import InfoGlyph from '@/shared/assets/icons/cirlceInfo.svg?react';
import s from './ItemActionsDrawer.module.scss';

export type ItemAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  /**
   * Если задан, действие рендерится как `<label htmlFor={htmlFor}>` (делегация
   * фокуса ModalByLabel) вместо обычной `<button>`: тап фокусирует целевой input
   * → хостовый `onFocusCapture` флипает нужный шаг edit-флоу, и iOS Safari
   * поднимает клавиатуру (императивный `.focus()` из клика по кнопке этого не
   * даёт). В этом режиме `onClick` ТОЛЬКО праймит состояние (напр. `primeEdit(
   * item)`) — он НЕ закрывает дровер и НЕ сетит шаг: иначе label размонтируется
   * до делегирования фокуса, а шаг погонится с focus-событием (см. CLAUDE.md
   * «Label focus delegation»). Дровер закрывается сам по уходу фокуса наружу.
   * Опускай для действий, которые навигируют/открывают (они закрываются-и-
   * выполняются через обычный ряд).
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
  /** Навигационные действия секции «Перейти» (напр. «Информация о продукте»).
   *  Пусто → секция не рендерится (у события нет detail-страницы). */
  actions: ItemAction[];
  /** Действия секции «Редактировать» — ряд круглых медалей (RoundButton). */
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
          // tone="soft" даёт постоянную ink-подложку (плитка) под глифом урны —
          // раньше danger был без idle-фона. Разрушительность держит placement
          // (угол, вне стека действий), не цвет — доп. confirm нет.
          <IconButton
            tone="soft"
            className={s.deleteBtn}
            onClick={handleDelete}
            aria-label="Удалить"
            icon={<TrashIcon />}
          />
        ) : undefined
      }
    >
      {/* Тело дровера = ActionList: секция «Редактировать» (ряд медалей) + секция
          «Перейти» (нав-ряды SettingRow). Секции = h3 (заголовок дровера h2 → тело
          держит следующий ярус, корректный outline). */}
      <ActionList>
        {editActions && editActions.length > 0 && (
          <ActionList.Section as="h3" label="Редактировать" italicLabel>
            {/* Ряд медалей (RoundButton look="raised"): приподнятые surface-2 плитки
                в утопленном лотке Well (variant="round") — паттерн «вдавленность +
                приподнятые круглые плитки», един с монетами навигации. НЕ конвертируем
                в SettingRow — медаль несёт htmlFor-делегацию фокуса edit-флоу. */}
            <div className={s.editSection}>
              <Well variant="round">
                <div className={s.editRow}>
                {editActions.map((action, i) =>
                  action.htmlFor ? (
                    // Медаль = `<label htmlFor>`: тап фокусирует целевой edit-input,
                    // хостовый onFocusCapture флипает шаг (iOS поднимает клавиатуру) и
                    // закрывает дровер. onClick только праймит — НЕ closes/setStep,
                    // иначе label размонтируется до делегирования (CLAUDE.md «Label
                    // focus delegation»). Дровер открыт с trapFocus:false, иначе
                    // focus-trap завернул бы делегацию назад.
                    <RoundButton
                      key={`${action.label}-${i}`}
                      look="raised"
                      floating={false}
                      htmlFor={action.htmlFor}
                      onClick={action.onClick}
                      ariaLabel={action.label}
                      arcTop={action.label}
                      centerNode={action.icon}
                    />
                  ) : (
                    // Без htmlFor — обычная кнопка-медаль: закрыть-и-выполнить.
                    <RoundButton
                      key={`${action.label}-${i}`}
                      look="raised"
                      floating={false}
                      onClick={() => handleAction(action)}
                      ariaLabel={action.label}
                      arcTop={action.label}
                      centerNode={action.icon}
                    />
                  )
                )}
                </div>
              </Well>
            </div>
          </ActionList.Section>
        )}

        {actions.length > 0 && (
          <ActionList.Section as="h3" label="Перейти" italicLabel>
            <div className={s.rows}>
              {actions.map((action, i) => (
                <SettingRow
                  key={`${action.label}-${i}`}
                  // Дефолт-глиф — кольцо-ⓘ: единственный консумер (buildInfoActions)
                  // не шлёт свой icon, ряд всегда «Информация о…».
                  icon={action.icon ?? <InfoGlyph width={18} height={18} />}
                  label={action.label}
                  trailing={<ChevronGlyph />}
                  onClick={() => handleAction(action)}
                />
              ))}
            </div>
          </ActionList.Section>
        )}
      </ActionList>
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
