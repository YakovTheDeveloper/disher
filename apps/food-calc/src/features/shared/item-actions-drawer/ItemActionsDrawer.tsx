import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ActionList } from '@/shared/ui/ActionList';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import { IconButton } from '@/shared/ui/atoms/Button';
import { OpenPageGlyph } from '@/shared/ui/atoms/OpenPageGlyph';
import type { BaseDrawerProps } from '@/shared/ui';
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
  /** Тихая строка под title. По умолчанию «Действия»; `null` — без subtitle
   *  (событие: заголовок уже несёт весь контекст, вторая строка шумит). */
  subtitle?: string | null;
  /** Destructive — rendered as a danger row at the BOTTOM of the action stack
   *  (канон: деструктив в конце списка действий, не в chrome — верхний правый
   *  угол зарезервирован за навигацией, иначе один слот несёт противоположные
   *  смыслы и ломает моторную память). One tap deletes (no extra confirm). Omit
   *  for non-deletable entities (e.g. catalog foods) → the row is dropped. */
  onDelete?: () => void;
  /** Подпись danger-ряда удаления. Дефолт «Удалить» (сама сущность, напр. свой
   *  продукт в поиске); «Убрать из списка» — когда удаляется ЗАПИСЬ в списке
   *  (приём пищи в расписании, ингредиент блюда), а сущность живёт дальше. */
  deleteLabel?: string;
  /** Переход на страницу сущности («Информация о продукте») — кнопка ↗ в
   *  topRight хедера (как в NutrientShowcaseDrawer), НЕ ряд в стеке: навигация
   *  живёт в chrome, действия над сущностью — в теле. Опусти, если detail-
   *  страницы нет (событие, порция, КАТАЛОЖНЫЙ продукт — гейта `isCatalogId`
   *  в buildInfoActions, та же что `pageRoute` в ProductDrawer). */
  pageAction?: ItemAction;
  /** «Нутриенты» — ряд SettingRow ПЕРЕД секцией редактирования:
   *  открывает быструю нижнюю витрину (ProductDrawer/DishDrawer). В отличие от
   *  pageAction доступен и каталожным продуктам (витрина read-only, она у них
   *  единственная «информация»). Опусти для не-еды (событие, порция, анализ). */
  nutrientsAction?: ItemAction;
  /** Действия секции «Поменять» — плоские ряды SettingRow с глифами. */
  editActions?: ItemAction[];
}

// Each handler closes the drawer FIRST, then runs the callback. Order matters:
// an info-action that navigates must not leave the drawer mounted over the new
// page (see spec Edge cases).
export const ItemActionsDrawer = ({
  onClose,
  title,
  subtitle,
  onDelete,
  deleteLabel = 'Удалить',
  pageAction,
  nutrientsAction,
  editActions,
}: Props) => {
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
      // Имя сущности + тихий subtitle (compact) — по умолчанию «Действия», консумер
      // может переопределить/скрыть (null). Title опционален (у события
      // detail-страницы нет) — без него шапка без видимого заголовка, а sr-only имя
      // держит a11yLabel.
      header={
        title
          ? {
              kind: 'compact',
              title,
              subtitle: subtitle === undefined ? 'Действия' : (subtitle ?? undefined),
            }
          : undefined
      }
      a11yLabel="Действия"
      flushBodyPaddingTop
      topRight={
        pageAction ? (
          // Кнопка «уйти на страницу»: глиф ↗ (OpenPageGlyph), тон soft — как в
          // NutrientShowcaseDrawer. Размер квадрата несёт chrome-слот DrawerLayout.
          <IconButton
            tone="soft"
            onClick={() => handleAction(pageAction)}
            aria-label={pageAction.label}
            icon={<OpenPageGlyph width={24} height={24} />}
          />
        ) : undefined
      }
    >
      {/* Тело дровера = ActionList: секция «Поменять» (ряды SettingRow) +
          danger-ряд удаления внизу. Секции = h3 (заголовок дровера h2 → тело
          держит следующий ярус, корректный outline). */}
      <ActionList>
        {nutrientsAction && (
          // Быстрый просмотр нутриентов — ПЕРВЫМ рядом, до правок: «подглядеть»
          // чаще нужно, чем «менять». Переход к витрине, а не правка сущности —
          // секция без заголовка (как danger-ряд).
          <ActionList.Section as="h3" flushTop>
            <div className={s.rows}>
              <SettingRow
                icon={<NutrientsIcon />}
                label={nutrientsAction.label}
                onClick={() => handleAction(nutrientsAction)}
                trailing={<ChevronGlyph />}
              />
            </div>
          </ActionList.Section>
        )}

        {editActions && editActions.length > 0 && (
          <ActionList.Section as="h3" label="Поменять">
            {/* Правки — плоские ряды SettingRow с тематическими глифами
                (edit-action-icons), как прочие ряды дровера; группу отличают
                лейбл секции и монохромные иконки. Шеврон › справа — все ряды
                секции ведут на шаг edit-флоу (как и ряд нутриентов выше; без
                шеврона только danger-ряд удаления — он выполняет, а не ведёт).
                Ряд несёт htmlFor-делегацию
                фокуса edit-флоу (label-режим): onPointerDown только праймит —
                НЕ closes/setStep, иначе label размонтируется до делегирования
                (CLAUDE.md «Label focus delegation»). Без htmlFor — обычная
                кнопка: закрыть-и-выполнить. */}
            <div className={`${s.rows} ${s.editRows}`}>
              {editActions.map((action, i) =>
                action.htmlFor ? (
                  <SettingRow
                    key={`${action.label}-${i}`}
                    icon={action.icon}
                    label={action.label}
                    htmlFor={action.htmlFor}
                    onPointerDown={action.onClick}
                    trailing={<ChevronGlyph />}
                  />
                ) : (
                  <SettingRow
                    key={`${action.label}-${i}`}
                    icon={action.icon}
                    label={action.label}
                    onClick={() => handleAction(action)}
                    trailing={<ChevronGlyph />}
                  />
                )
              )}
            </div>
          </ActionList.Section>
        )}

        {onDelete && (
          // Деструктив — ПОСЛЕДНИМ рядом стека, в danger-тоне (канон action-sheet:
          // удаление внизу списка действий, а не в chrome-угол). Без заголовка
          // секции — красный тон + глагол в лейбле несут смысл сами, подпись вида
          // «Необратимые действия» была бы шумом (ни HIG, ни Material таких
          // групповых лейблов не делают).
          <ActionList.Section as="h3">
            <div className={s.rows}>
              <SettingRow danger icon={<TrashIcon />} label={deleteLabel} onClick={handleDelete} />
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

// Нутриенты — лабораторная колба с линией жидкости: «состав/анализ» одним
// силуэтом. Тот же строчный канон, что и урна (24×24, stroke 1.5, currentColor).
const NutrientsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.5 3h5M10.5 3v5.1L5.9 16.9A2.2 2.2 0 0 0 7.9 20.4h8.2a2.2 2.2 0 0 0 2-3.5L13.5 8.1V3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M7.6 13.5h8.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
