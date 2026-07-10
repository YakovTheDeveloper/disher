import type { ReactNode } from 'react';
import clsx from 'clsx';
import { FieldLabel } from '@/shared/ui/atoms/Typography/FieldLabel';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './FormLayout.module.scss';

type FormLayoutProps = {
  children: ReactNode;
  className?: string;
};

/**
 * FormLayout — доменный композит раскладки формы (по образцу Polaris FormLayout).
 *
 * Владеет вертикальным ритмом МЕЖДУ группами/полями (`--sys-stack-section`, 24).
 * Дети — `FormLayout.Group` или отдельные поля. Принцип: пространством владеет
 * контейнер, ни один ребёнок не ставит себе `margin`. Это разводит класс
 * регрессий «поехало после правки соседа» — раньше зазоры дублировались как
 * raw-px в каждой форме, теперь живут в одном месте на sys-токенах.
 *
 * Кладётся ОДНИМ ребёнком внутрь `ModalShell.Body` (или панельного `.body`):
 * Body гапит верхний ярус (explainer ↔ FormLayout ↔ preview), FormLayout —
 * свои группы. Задвоения секционного gap нет — FormLayout один ребёнок в зоне.
 */
export function FormLayout({ children, className }: FormLayoutProps) {
  return <div className={clsx(styles.layout, className)}>{children}</div>;
}

type GroupProps = {
  children: ReactNode;
  /** Заголовок группы (рендерится через `FieldLabel`). Опционален. */
  label?: ReactNode;
  /** Если задан — заголовок становится `<label htmlFor>`, связанным с инпутом. */
  htmlFor?: string;
  /**
   * Раскладка полей ВНУТРИ группы:
   *   'vertical' (деф.) — столбик, зазор `--sys-stack-field` (12);
   *   'horizontal'      — ряд равной ширины (напр. Возраст · Вес · Рост).
   */
  direction?: 'vertical' | 'horizontal';
  className?: string;
};

/**
 * FormLayout.Group — семантическая группа полей как первоклассная сущность.
 * Владеет зазорами ВНУТРИ себя: лейбл → контент = `--sys-stack-row` (8, тесно —
 * подпись принадлежит группе), между полями = `--sys-stack-field` (12).
 */
function Group({ children, label, htmlFor, direction = 'vertical', className }: GroupProps) {
  return (
    <div className={clsx(styles.group, className)}>
      {label != null && <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>}
      <div className={clsx(styles.content, direction === 'horizontal' && styles.horizontal)}>
        {children}
      </div>
    </div>
  );
}

FormLayout.Group = Group;

type CaptionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * FormLayout.Caption — интро-подсказка, ПРИНАДЛЕЖАЩАЯ форме. Рендерится первым
 * ребёнком `FormLayout` через `<Text role="caption">`. Тесный зазор до первой
 * группы (`--sys-stack-field`, не секционные 24) живёт на контейнере — см.
 * owl-правило `.layout > .caption + *` в scss: подпись «принадлежит» форме, а не
 * читается отдельной секцией. Раньше интро жило section-соседом в `ModalShell.Body`
 * (24) — отсюда разрыв «интро ↔ форма»; теперь форма владеет своим интро.
 */
function Caption({ children, className }: CaptionProps) {
  return (
    <Text as="p" role="caption" className={clsx(styles.caption, className)}>
      {children}
    </Text>
  );
}

FormLayout.Caption = Caption;

export default FormLayout;
