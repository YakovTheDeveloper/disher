import type { ReactNode, PointerEventHandler } from 'react';
import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography';
import { TapTarget } from '@/shared/ui/atoms/TapTarget';
import styles from './CardLayout.module.scss';

/**
 * Текст-ячейка слота: контент + способ нажатия. CardLayout сам оборачивает
 * контент в КАНОН роли слота (тип/цвет — см. renderTyped) и в <TapTarget>
 * (`label htmlFor` = iOS-focus / `button` = onTap / `span` = статичный). Так
 * типографика и тап-обёртка живут в ОДНОМ месте — потребитель отдаёт лишь данные.
 */
export type CardTextCell = {
  content: ReactNode;
  /** Переопределить роль-по-слоту (тип+размер+цвет). Нужно для переиспользования
   *  каркаса под разные сущности: напр. событие кладёт время в titleEnd с
   *  role:'time', чтобы оно встало на базовую линию заголовка (верх-право), а не
   *  падало в правый-нижний угол как у мессенджер-еды. По умолчанию = роль слота. */
  role?: SlotRole;
  /** label-mode: фокус инпута через `<label htmlFor>` (iOS-focus канон). */
  htmlFor?: string;
  /** JS-обработчик тапа (открыть модалку). С htmlFor сосуществует; без него → `<button>`. */
  onTap?: () => void;
  /** Сайд-канал (еда: застолбить activeItemId на pointerdown ПЕРЕД фокусом). */
  onPointerDown?: PointerEventHandler<HTMLElement>;
  /** Доп.класс на тап-зону (эллипсис/клэмп конкретного слота). */
  className?: string;
};

/**
 * Node-escape: готовый богатый/stateful/много-голосый узел (QtyStack, CardTime,
 * ряд чипов, кластер `[qty][имя]`). CardLayout не навязывает ни тап, ни типографику —
 * узел владеет собой целиком.
 */
export type CardNodeCell = { node: ReactNode };

export type CardCell = CardTextCell | CardNodeCell;

/** Роль = функция СЛОТА (геометрия фикс): title→body, meta→caption, qty→число,
 *  time→мелкое число. Единственный источник типографики/цвета слота. */
type SlotRole = 'title' | 'meta' | 'qty' | 'time';

export type CardLayoutProps = {
  /** Верх-лево — имя/текст. Обязателен. */
  title: CardCell;
  /** Верх-право — qty/граммы. Прибит вправо, по базовой линии с title. Опц. */
  titleEnd?: CardCell;
  /** Низ-лево — детали/чипы. Течёт, переносится. Опц. */
  meta?: CardCell;
  /** Низ-право — время. Прибит к правому-НИЖНЕМУ углу (мессенджер-канон). Опц. */
  metaEnd?: CardCell;
  className?: string;
};

function isNodeCell(cell: CardCell): cell is CardNodeCell {
  return 'node' in cell;
}

// Канон роли: прозовые слоты → примитив <Text role> (тип), числовые → размер+цвет
// слота (sans, в один голос с QtyStack/CardTime). Цвет всегда здесь — Text/Numeral
// его не ставят (контекстный). Один источник типографики карточек.
function renderTyped(role: SlotRole, content: ReactNode): ReactNode {
  switch (role) {
    case 'qty':
      return <span className={styles.qty}>{content}</span>;
    case 'time':
      return <span className={styles.time}>{content}</span>;
    case 'meta':
      return (
        <Text as="span" role="caption" className={styles.meta}>
          {content}
        </Text>
      );
    case 'title':
    default:
      return (
        <Text as="span" role="body" className={styles.title}>
          {content}
        </Text>
      );
  }
}

function renderCell(cell: CardCell | undefined, slotRole: SlotRole): ReactNode {
  if (cell == null) return null;
  if (isNodeCell(cell)) return cell.node;

  const { content, role, htmlFor, onTap, onPointerDown, className } = cell;
  const inner = renderTyped(role ?? slotRole, content);
  const cls = clsx(styles.cell, className);

  // label = делегирует фокус инпуту (iOS-focus канон); button = JS-тап; span = статика.
  if (htmlFor) {
    return (
      <TapTarget as="label" htmlFor={htmlFor} onClick={onTap} onPointerDown={onPointerDown} className={cls}>
        {inner}
      </TapTarget>
    );
  }
  if (onTap) {
    return (
      <TapTarget as="button" type="button" onClick={onTap} onPointerDown={onPointerDown} className={cls}>
        {inner}
      </TapTarget>
    );
  }
  return (
    <TapTarget as="span" onPointerDown={onPointerDown} className={cls}>
      {inner}
    </TapTarget>
  );
}

/**
 * CardLayout — общая геометрия + типографика карточки-сообщения: 2 строки, в
 * каждой левый-текучий (`start`) + правый-прибитый (`end`) край. Слот = `CardCell`
 * (текст-ячейка → CardLayout сам строит тип+тап; node-escape → готовый узел).
 *
 * Владеет раскладкой И типографикой-по-роли (тип+цвет слота — один источник).
 * НЕ красит фон — подложку держит LongPressRow (один владелец bg).
 *
 * См. tds/ANALYSIS/cardshell-unification-2026-06-25.md
 */
export function CardLayout({ title, titleEnd, meta, metaEnd, className }: CardLayoutProps) {
  const hasMeta = meta != null || metaEnd != null;
  return (
    <div className={clsx(styles.card, className)}>
      <div className={styles.titleRow}>
        <div className={styles.start}>{renderCell(title, 'title')}</div>
        {titleEnd != null && <div className={styles.end}>{renderCell(titleEnd, 'qty')}</div>}
      </div>

      {hasMeta && (
        <div className={styles.metaRow}>
          {/* `.start` рендерим всегда (даже пустым) — это flex:1 распорка, что
              держит metaEnd (время) прижатым вправо, когда meta нет (еда без деталей). */}
          <div className={styles.start}>{renderCell(meta, 'meta')}</div>
          {metaEnd != null && <div className={styles.end}>{renderCell(metaEnd, 'time')}</div>}
        </div>
      )}
    </div>
  );
}

export default CardLayout;
