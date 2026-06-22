import clsx from 'clsx';
import { Select as BaseSelect } from '@base-ui/react/select';
import TickIcon from '@/shared/assets/icons/tick.svg?react';
import s from './Select.module.scss';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** sr-метка — у триггера нет видимого `<label>`. */
  ariaLabel: string;
  className?: string;
}

// Chevron — inline (в icons/ нет down-варианта; svgr-импорт ради одной стрелки
// избыточен). currentColor → красится `--sys-field-adornment`.
const ChevronDownIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
    <path
      d="M4 6l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Тонкая обёртка над Base UI Select (та же библиотека, что Drawer/Dialog).
 * Тема — через `--sys-field-*` токены; попап портируется в `<body>`, где
 * `[data-modal-fields]` (живой ModalShell-вариант) объявляет токены, поэтому
 * тон доезжает и в портал. `items={options}` отдаёт `<Select.Value>` готовый
 * лейбл выбранного пункта.
 */
export const Select = ({ value, options, onChange, ariaLabel, className }: SelectProps) => (
  <BaseSelect.Root
    value={value}
    items={options}
    onValueChange={(next) => {
      if (next != null) onChange(next as string);
    }}
  >
    <BaseSelect.Trigger className={clsx(s.trigger, className)} aria-label={ariaLabel}>
      <BaseSelect.Value className={s.value} />
      <BaseSelect.Icon className={s.icon}>
        <ChevronDownIcon />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
    <BaseSelect.Portal>
      <BaseSelect.Positioner
        className={s.positioner}
        sideOffset={6}
        alignItemWithTrigger={false}
      >
        <BaseSelect.Popup className={s.popup}>
          {options.map((option) => (
            <BaseSelect.Item key={option.value} value={option.value} className={s.item}>
              <BaseSelect.ItemText className={s.itemText}>{option.label}</BaseSelect.ItemText>
              <BaseSelect.ItemIndicator className={s.itemIndicator}>
                <TickIcon />
              </BaseSelect.ItemIndicator>
            </BaseSelect.Item>
          ))}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  </BaseSelect.Root>
);

export default Select;
