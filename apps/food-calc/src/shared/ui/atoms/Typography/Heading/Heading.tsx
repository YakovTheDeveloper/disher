import clsx from 'clsx';
import styles from './Heading.module.scss';

/** Семантические типо-РОЛИ heading-яруса (ярус sys · типографика, пресет «сист»
 *  5dbbbf43; ground truth tds/typography-roles-system.md). Композит family+size+
 *  weight+lh+tracking приходит из `--sys-text-*` через mixin `text-role()`.
 *  Это ЕДИНСТВЕННЫЙ API заголовка — legacy-`size` схлопнут в роли 2026-06-23. */
type HeadingRole = 'display' | 'headline' | 'title';

type Props = {
  children: React.ReactNode;
  /** Семантическая роль — задаёт весь типографический композит. */
  role: HeadingRole;
  /** DOM-тег. По умолч. `h2`; `span` — когда заголовок инлайновый (напр. подпись
   *  активного таба внутри кнопки); `h4` — для глубоких секций-заголовков (AtomList). */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span';
  /** Рендерит обёртку-`<header>` слайда HomePage (нижний отступ слайда + скрытие
   *  под NavSwitcher). Ортогонально роли — это layout-обвязка, не тип-ярус. */
  masthead?: boolean;
  className?: string;
};

/**
 * Canonical display heading — ОДИН Onest bold-sans голос (Apple Large Title).
 * Используй для любого section/overlay/masthead заголовка. serif-italic — НЕ
 * этот примитив (тихий указатель = <QuietLabel>).
 *
 * API — `role` (display/headline/title), композит из `--sys-text-*`.
 */
const Heading = ({ children, role, as = 'h2', masthead, className }: Props) => {
  const Tag = as;
  const heading = <Tag className={clsx(styles.heading, styles[role], className)}>{children}</Tag>;
  // masthead несёт свою обёртку-<header> (отступ слайда + NavSwitcher hiding).
  if (masthead) {
    return <header className={styles.mastheadWrap}>{heading}</header>;
  }
  return heading;
};

export default Heading;
