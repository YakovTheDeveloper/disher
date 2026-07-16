import {
  Children,
  isValidElement,
  type FC,
  type ReactNode,
  type ReactElement,
  type PointerEventHandler,
  type CSSProperties,
  type ComponentProps,
} from 'react';
import clsx from 'clsx';
import { LongPressRow } from '@/features/shared/long-press-item';
import { TapTarget } from '@/shared/ui/atoms/TapTarget';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './Card.module.scss';

/**
 * Card — compound-каркас карточки-сообщения (еда / событие / предложка / dish-
 * ингредиент). Заменил прежнюю тройку (shell + layout + дискриминированный union
 * слот-ячеек): консумер кладёт ГОТОВЫЙ JSX прямо в `Card.Title/Meta/Time`, без
 * `{ content, htmlFor, onTap }`-объекта и без свитча типографики по роли.
 *
 *   <Card.Root id tod recent onLongPress …>
 *     {hasQty && <Card.Qty>{qtyNode}</Card.Qty>}
 *     <Card.Title htmlFor onTap onPointerDown>{titleNode}</Card.Title>
 *     {hasMeta && <Card.Meta htmlFor onTap>{chipsOrDetails}</Card.Meta>}
 *     {showTime && <Card.Time htmlFor onTap dim>{clock}</Card.Time>}
 *   </Card.Root>
 *
 * Ответственность:
 *  - `Card.Root` = подложка `LongPressRow` (фон/`data-tod`/жест/entrance/recent-
 *    dot) + геометрия [qty-столбик | контент-столбик]. Гасит `--row-pad-inline:0`
 *    на строке, инсет контента владеет внутренний `.card` (drawer-layout канон:
 *    surface = фон, content = padding). Читает compound-детей и применяет
 *    ТРЕЙЛИНГ-ПРАВИЛО к `Card.Time`.
 *  - `Card.Qty` — ЛЕВЫЙ столбик (опционален): число садится на первую базовую
 *    линию имени, холодный числовой голос в один тон с временем (еда/предложка/
 *    dish-item; у события/анализа qty нет → столбик отсутствует). Узел владеет
 *    собой (node-escape) — консумер кладёт `<EditableQuantity>`.
 *  - `Card.Title` — верх-лево, body. `Card.Meta` — низ-лево, caption, опционален
 *    (физически отсутствует, когда пусто). `Card.Time` — трейлинг-число numeral-sm.
 *
 * Типографика «by construction»: текст-слот (children = строка) оборачивается в
 * `<Text role>` + `<TapTarget>`; node-escape (готовый кластер `[qty][имя]`,
 * `<CardTime>`, лента чипов) рендерится сырым — узел владеет собой целиком.
 */

type TapProps = {
  /** label-mode: фокус инпута через `<label htmlFor>` (iOS-focus канон). */
  htmlFor?: string;
  /** JS-обработчик тапа (открыть модалку). С htmlFor сосуществует; без него → `<button>`. */
  onTap?: () => void;
  /** Сайд-канал (еда: застолбить activeItemId на pointerdown ПЕРЕД фокусом). */
  onPointerDown?: PointerEventHandler<HTMLElement>;
  /** Доп.класс на тап-зону (эллипсис/клэмп конкретного слота). */
  className?: string;
};

export type CardTitleProps = TapProps & { children: ReactNode };
export type CardMetaProps = TapProps & {
  children: ReactNode;
  /** Типо-ярус деталь-строки. `caption` (default, 13px) — счётчики/мета; `body`
   *  (16px) — food-карточка, где деталь = равноправный контент; `card-caption`
   *  (13px, лёгкий вес + широкий трекинг + холодный тон) — особенности приёма
   *  пищи («с кожурой»): тихий противовес жирному имени над ним. */
  size?: 'body' | 'caption' | 'card-caption';
};
export type CardTimeProps = TapProps & {
  children: ReactNode;
  /** Dedup: время совпадает с рядом выше → сильно гасим (тап всё равно правит). */
  dim?: boolean;
};
/** qty-столбик: чистый узел (`<EditableQuantity>` владеет тап-правкой сам). */
export type CardQtyProps = { children: ReactNode; className?: string };

// Marker-компоненты: `Card.Root` читает их props через `React.Children` и сам
// раскладывает (трейлинг-правило требует, чтобы Root размещал `Card.Time` в
// ПОСЛЕДНЕМ присутствующем ряду). Поэтому сами по себе они не рендерятся —
// возврат null делает их инертными, если их применят вне `Card.Root`.
//
// Опознаём слот по СТАТИЧНОМУ полю `cardSlot`, НЕ по ссылочному равенству
// (`child.type === CardTitle`): под React Compiler (Babel-плагин в vite.config)
// + Fast Refresh идентичность функции-типа дрейфует между модулями/HMR-
// поколениями, и `===` молча промахивается → Root не находит детей → пустой
// рендер (0 высоты). Чтение поля с `child.type` переживает обёртки компилятора и
// горячую перезагрузку (обе копии функции несут одно и то же `cardSlot`).
type SlotName = 'qty' | 'title' | 'meta' | 'time';
type SlotMarker<P> = FC<P> & { cardSlot: SlotName };

const CardQty: SlotMarker<CardQtyProps> = Object.assign((() => null) as FC<CardQtyProps>, {
  cardSlot: 'qty' as const,
});
const CardTitle: SlotMarker<CardTitleProps> = Object.assign((() => null) as FC<CardTitleProps>, {
  cardSlot: 'title' as const,
});
const CardMeta: SlotMarker<CardMetaProps> = Object.assign((() => null) as FC<CardMetaProps>, {
  cardSlot: 'meta' as const,
});
const CardTime: SlotMarker<CardTimeProps> = Object.assign((() => null) as FC<CardTimeProps>, {
  cardSlot: 'time' as const,
});

// Текст-слот (title/meta): строка → <Text role> (тип) + цвет-класс слота; узел →
// сырьём (консумер владеет типографикой). Тап-обёртка: label htmlFor (iOS-focus) /
// button onTap / span (статичный текст всё равно получает тап-пол TapTarget).
function renderText(
  role: 'body' | 'caption' | 'card-caption',
  colorClass: string,
  { children, htmlFor, onTap, onPointerDown, className }: TapProps & { children: ReactNode }
): ReactNode {
  const isText = typeof children === 'string';
  const cls = clsx(styles.cell, className);
  if (isText) {
    const inner = (
      <Text as="span" role={role} className={colorClass}>
        {children}
      </Text>
    );
    if (htmlFor) {
      return (
        <TapTarget
          as="label"
          htmlFor={htmlFor}
          onClick={onTap}
          onPointerDown={onPointerDown}
          className={cls}
        >
          {inner}
        </TapTarget>
      );
    }
    if (onTap) {
      return (
        <TapTarget
          as="button"
          type="button"
          onClick={onTap}
          onPointerDown={onPointerDown}
          className={cls}
        >
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
  // Node-escape: готовый узел владеет собой (тип/тап/цвет). `.start > *` даёт ему
  // flex:1 — узел занимает строку. Тап-зоны внутри (имя/qty) узел ставит сам.
  return children;
}

// Время: текст (событие) → `.time`-span (numeral-sm/secondary/tabular) в тап-
// обёртке; узел `<CardTime>` (еда/предложка) → сырьём (свой редактор/хром).
function renderTime({
  children,
  htmlFor,
  onTap,
  onPointerDown,
  className,
  dim,
}: CardTimeProps): ReactNode {
  if (htmlFor || onTap) {
    const inner = <span className={clsx(styles.time, dim && styles.dim)}>{children}</span>;
    const cls = clsx(styles.cell, styles.timeCell, className);
    if (htmlFor) {
      return (
        <TapTarget
          as="label"
          htmlFor={htmlFor}
          onClick={onTap}
          onPointerDown={onPointerDown}
          className={cls}
        >
          {inner}
        </TapTarget>
      );
    }
    return (
      <TapTarget
        as="button"
        type="button"
        onClick={onTap}
        onPointerDown={onPointerDown}
        className={cls}
      >
        {inner}
      </TapTarget>
    );
  }
  return children;
}

export type CardRootProps = Omit<ComponentProps<typeof LongPressRow>, 'children'> & {
  children: ReactNode;
};

function CardRoot({ children, style, ...rowProps }: CardRootProps) {
  let qtyEl: ReactElement | undefined;
  let titleEl: ReactElement | undefined;
  let metaEl: ReactElement | undefined;
  let timeEl: ReactElement | undefined;
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const slot = (child.type as Partial<SlotMarker<unknown>>)?.cardSlot;
    if (slot === 'qty') qtyEl = child;
    else if (slot === 'title') titleEl = child;
    else if (slot === 'meta') metaEl = child;
    else if (slot === 'time') timeEl = child;
  });

  // Title обязателен — без него Root отрендерил бы пустой ряд (0 высоты). В dev
  // громко предупреждаем, чтобы регресс не уходил тихо в вёрстку.
  if (import.meta.env.DEV && !titleEl) {
    console.warn('Card.Root: нет Card.Title среди детей — карточка отрендерится пустой.');
  }

  // Трейлинг-время: `Card.Time` едет по ПОСЛЕДНЕМУ присутствующему ряду.
  //  - есть `Card.Meta` (нижний ряд) → время низ-право (конец metaRow, мессенджер-канон);
  //  - нет меты → время верх-право (конец titleRow), нижний ряд НЕ рендерится (collapse).
  // JS-ветка, не CSS-протез — мы владеем деревом, ветка предсказуема.
  const hasMeta = metaEl != null;
  const timeSlot = timeEl ? renderTime(timeEl.props as CardTimeProps) : null;
  const qtyProps = qtyEl?.props as CardQtyProps | undefined;

  return (
    <LongPressRow
      {...rowProps}
      // `.card` владеет горизонтальным инсетом — гасим строковый `--row-pad-inline`,
      // чтоб не задвоился. Инсет-инвариант ПОСЛЕ `...style`: консумер не должен
      // случайно вернуть строке паддинг (задвоит 16+16).
      style={{ ...style, '--row-pad-inline': 0 } as CSSProperties}
    >
      <div className={styles.card}>
        {/* qty-столбик (node-escape): узел владеет тап-правкой; цвет/вес — на `.qtyCol`. */}
        {qtyProps && (
          <div className={clsx(styles.qtyCol, qtyProps.className)}>{qtyProps.children}</div>
        )}

        {/* Контент-столбик: title/meta ряды + трейлинг-время. Без qty (событие/
            анализ) = единственный ребёнок `.card` → лейаут как прежде. */}
        <div className={styles.content}>
          <div className={styles.titleRow}>
            <div className={styles.start}>
              {titleEl && renderText('body', styles.title, titleEl.props as CardTitleProps)}
            </div>
            {!hasMeta && timeSlot && <div className={styles.end}>{timeSlot}</div>}
          </div>

          {hasMeta && (
            <div className={styles.metaRow}>
              {/* `.start` = flex:1 распорка, держит время прижатым вправо. */}
              <div className={styles.start}>
                {renderText(
                  (metaEl!.props as CardMetaProps).size ?? 'caption',
                  styles.meta,
                  metaEl!.props as CardMetaProps
                )}
              </div>
              {timeSlot && <div className={styles.end}>{timeSlot}</div>}
            </div>
          )}
        </div>
      </div>
    </LongPressRow>
  );
}

export const Card = {
  Root: CardRoot,
  Qty: CardQty,
  Title: CardTitle,
  Meta: CardMeta,
  Time: CardTime,
};

export default Card;
