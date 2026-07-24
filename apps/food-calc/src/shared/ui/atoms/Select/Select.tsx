import clsx from 'clsx';
import { Select as BaseSelect } from '@base-ui/react/select';
import TickIcon from '@/shared/assets/icons/tick.svg?react';
import { Numeral } from '@/shared/ui/atoms/Typography';
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
  /**
   * `ghost` — прозрачный триггер с тонкой subtle-обводкой вместо вдавленной
   * field-лунки. Для селекта на ряду-заголовке секции (напр. «Состав на» рядом с
   * лейблом «Нутриенты»): читается лёгким чипом-контролом, а не полем ввода, и не
   * спорит с заголовком.
   *
   * `inline` — вообще без подложки/рамки/лунки: триггер продолжает соседний текст,
   * шрифт/цвет наследует от родителя (`font: inherit`) → «Авокадо, На 100 г ▾»
   * звучит одной фразой. Хит-арея держится невидимо (negative margin в scss).
   *
   * Дефолт `default` — исходный field-триггер.
   */
  variant?: 'default' | 'ghost' | 'inline';
  /**
   * Приводит и триггер, и пункты попапа к нижнему регистру (`text-transform`). Для
   * инлайн-селекта, продолжающего фразу с маленькой буквы («Алыча, на 100 г») —
   * попап портируется в body и не наследует `text-transform` родителя, поэтому регистр
   * задаём тут, а не в обёртке.
   */
  lowercase?: boolean;
  /**
   * Рендерит числовые подстроки лейбла («на 100 г» → `100`) через примитив
   * `Numeral` (tabular+lining figures, family `--font-big-numeric`) — и в триггере,
   * и в пунктах попапа. Для селектов, где значение содержит числа-опоры (порция,
   * граммовка). Текст-обрамление («на … г») остаётся прозаическим шрифтом.
   */
  numeric?: boolean;
  className?: string;
}

// split с capture-группой чередует сегменты текст/число, поэтому НЕЧЁТНЫЕ индексы —
// это числа: их оборачиваем в Numeral, остальное отдаём как есть.
const NUMERIC_SEGMENTS = /(\d+(?:[.,]\d+)?)/;
const renderNumericLabel = (label: string) =>
  label.split(NUMERIC_SEGMENTS).map((seg, i) =>
    i % 2 === 1 ? (
      <Numeral key={i} as="span" size="sm" weight="regular">
        {seg}
      </Numeral>
    ) : (
      seg
    ),
  );

// Chevron — inline (в icons/ нет down-варианта; svgr-импорт ради одной стрелки
// избыточен). currentColor → красится `--sys-field-adornment`.
const ChevronDownIcon = () => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
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
export const Select = ({
  value,
  options,
  onChange,
  ariaLabel,
  variant = 'default',
  lowercase = false,
  numeric = false,
  className,
}: SelectProps) => (
  <BaseSelect.Root
    value={value}
    items={options}
    onValueChange={(next) => {
      if (next != null) onChange(next as string);
    }}
  >
    <BaseSelect.Trigger
      className={clsx(
        s.trigger,
        variant === 'ghost' && s.ghost,
        variant === 'inline' && s.inline,
        className,
      )}
      aria-label={ariaLabel}
    >
      {numeric ? (
        // Числовой лейбл выбранного пункта считаем сами (value → label) и рендерим
        // с Numeral — вместо BaseSelect.Value, чья строка-значение не расщепляется.
        <span className={clsx(s.value, lowercase && s.lowercase)}>
          {renderNumericLabel(options.find((o) => o.value === value)?.label ?? '')}
        </span>
      ) : (
        <BaseSelect.Value className={clsx(s.value, lowercase && s.lowercase)} />
      )}
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
              <BaseSelect.ItemText className={clsx(s.itemText, lowercase && s.lowercase)}>
                {numeric ? renderNumericLabel(option.label) : option.label}
              </BaseSelect.ItemText>
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
