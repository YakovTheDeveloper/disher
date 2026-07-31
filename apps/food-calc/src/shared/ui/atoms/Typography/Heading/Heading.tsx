import clsx from 'clsx';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './Heading.module.scss';

/** Семантические типо-РОЛИ heading-яруса (ярус sys · типографика, пресет «сист»
 *  5dbbbf43; ground truth tds/typography-roles-system.md). Композит family+size+
 *  weight+lh+tracking приходит из `--sys-text-*` через mixin `text-role()`.
 *  Это ЕДИНСТВЕННЫЙ API заголовка — legacy-`size` схлопнут в роли 2026-06-23. */
type HeadingRole = 'display' | 'headline' | 'title';

/** Ось ВЕСА (опц.) — перекрывает вес роли. Зеркалит ось <Text> (та же шкала
 *  <Numeral>): роль даёт размер/семантику, weight — начертание поверх неё.
 *  Дом произвольного веса — примитив, не сырой font-weight в компонентном scss
 *  (typo-encapsulation gate). */
type HeadingWeight = 'thin' | 'light' | 'regular' | 'semibold' | 'bold';

type Props = {
  children: ReactNode;
  /** Семантическая роль — задаёт весь типографический композит. */
  role: HeadingRole;
  /** Опц. ортогональный модификатор начертания поверх роли (не заменяет её). */
  weight?: HeadingWeight;
  /**
   * DOM-тег — полиморфно (как у `Text`). По умолч. `h2`; `span` — инлайновый
   * заголовок (подпись активного таба); `h4` — глубокая секция (AtomList);
   * `label` / `a` / `button` — когда заголовок САМ интерактивен/семантичен
   * (extra props — onClick, htmlFor, aria-* — форвардятся на тег).
   */
  as?: ElementType;
  /** Форвардится на тег — выставлять при `as="label"`, чтобы заголовок БЫЛ
   *  form-label (rename-флоу FoodName). Живёт вне HTMLAttributes, потому здесь. */
  htmlFor?: string;
  /** Рендерит обёртку-`<header>` слайда HomePage (нижний отступ слайда + скрытие
   *  под NavSwitcher). Ортогонально роли — это layout-обвязка, не тип-ярус. */
  masthead?: boolean;
  className?: string;
} & HTMLAttributes<HTMLElement>;

/**
 * Canonical display heading — ОДИН Onest bold-sans голос (Apple Large Title).
 * Используй для любого section/overlay/masthead заголовка. serif-italic — НЕ
 * этот примитив (тихий указатель = <QuietLabel>).
 *
 * API — `role` (display/headline/title), композит из `--sys-text-*`. Полиморфен
 * через `as` (как `Text`): заголовок может быть `<label htmlFor>` / кликабельным
 * без лишней обёртки — extra DOM-пропсы форвардятся на тег.
 */
const Heading = ({ children, role, weight, as, masthead, className, ...rest }: Props) => {
  const Tag = (as ?? 'h2') as ElementType;
  const heading = (
    <Tag
      className={clsx(styles.heading, styles[role], weight && styles[weight], className)}
      {...rest}
    >
      {children}
    </Tag>
  );
  // masthead несёт свою обёртку-<header> (отступ слайда + NavSwitcher hiding).
  if (masthead) {
    return <header className={styles.mastheadWrap}>{heading}</header>;
  }
  return heading;
};

export default Heading;
