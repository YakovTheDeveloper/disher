import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ActionList } from '@/shared/ui/ActionList';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import type { BaseDrawerProps } from '@/shared/ui';
import s from './EntityEditDrawer.module.scss';

interface Props extends BaseDrawerProps<void> {
  /** Имя сущности — заголовок шапки. */
  title: string;
  /**
   * Ряд «Изменить название» — `<label htmlFor>`: тап делегирует фокус инпуту
   * ChangeNameModal (iOS focus-канон, как ряды правок ItemActionsDrawer). Дровер
   * обязан быть открыт с `trapFocus: false` — иначе focus-trap завернёт
   * делегацию назад. Закрывается сам по уходу фокуса наружу.
   */
  nameInputId?: string;
  /** Ряд «Изменить описание» — та же label-делегация на ChangeDescriptionModal. */
  descriptionInputId?: string;
  /** Ряд «Редактировать нутриенты» — закрыть-и-выполнить (модалка поверх). */
  onEditNutrients?: () => void;
  /** Danger-ряд внизу стека. Опусти для read-only сущностей. */
  onDelete?: () => void;
  deleteLabel?: string;
}

/**
 * Нижний дровер действий редактирования со страниц сущности (продукт/блюдо) —
 * замена карандаш-DropdownMenu (2026-07-29): действия живут в action-sheet,
 * а не в popover у хедера. Открытие:
 * `drawerStore.show(EntityEditDrawer, { … }, { trapFocus: false })`.
 */
export const EntityEditDrawer = ({
  onClose,
  title,
  nameInputId,
  descriptionInputId,
  onEditNutrients,
  onDelete,
  deleteLabel = 'Удалить',
}: Props) => {
  const handleAction = (action?: () => void) => {
    onClose();
    action?.();
  };

  return (
    <DrawerLayout
      header={{ kind: 'compact', title, subtitle: 'Редактирование' }}
      a11yLabel="Редактирование"
    >
      <ActionList>
        {(nameInputId || descriptionInputId || onEditNutrients) && (
          <ActionList.Section as="h3" flushTop>
            <div className={s.rows}>
              {nameInputId && (
                <SettingRow icon={<PencilIcon />} label="Изменить название" htmlFor={nameInputId} />
              )}
              {descriptionInputId && (
                <SettingRow
                  icon={<TextIcon />}
                  label="Изменить описание"
                  htmlFor={descriptionInputId}
                />
              )}
              {onEditNutrients && (
                <SettingRow
                  icon={<NutrientsIcon />}
                  label="Редактировать нутриенты"
                  onClick={() => handleAction(onEditNutrients)}
                />
              )}
            </div>
          </ActionList.Section>
        )}

        {onDelete && (
          // Деструктив — ПОСЛЕДНИМ рядом стека (канон action-sheet, 1:1 с
          // ItemActionsDrawer).
          <ActionList.Section as="h3">
            <div className={s.rows}>
              <SettingRow
                danger
                icon={<TrashIcon />}
                label={deleteLabel}
                onClick={() => handleAction(onDelete)}
              />
            </div>
          </ActionList.Section>
        )}
      </ActionList>
    </DrawerLayout>
  );
};

// Тот же строчный канон иконок, что в ItemActionsDrawer (24×24, stroke 1.5,
// currentColor).
const PencilIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1zM14.5 6.5l3 3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TextIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 6h16M4 12h16M4 18h9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

// Нутриенты — лабораторная колба с линией жидкости (как в ItemActionsDrawer).
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

export default EntityEditDrawer;
