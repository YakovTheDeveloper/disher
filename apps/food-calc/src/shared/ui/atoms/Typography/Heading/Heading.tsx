import clsx from 'clsx';
import styles from './Heading.module.scss';

/** Семантические типо-РОЛИ heading-яруса (ярус sys · типографика, пресет «сист»
 *  5dbbbf43; ground truth tds/typography-roles-system.md). Композит family+size+
 *  weight+lh+tracking приходит из `--sys-text-*` через mixin `text-role()`. Это
 *  целевой API; `size` ниже — legacy-шкала, мигрирует в роли (M2). */
type HeadingRole = 'display' | 'headline' | 'title';

/** Legacy type-scale tier (до ролевой системы). `screen` — page header, `modal` —
 *  wizard-flow modal, `modalSub` — sub-heading inside a modal, `drawer` — drawer
 *  header, `field` — мелкий под-заголовок поля/секции (16px), `section` — in-page
 *  section, `masthead` — крупная шапка слайда HomePage (рендерит обёртку-<header>),
 *  `card` — тихий заголовок карточки (17px, вес 600). Мигрирует в `role` (M2). */
type HeadingSize = 'screen' | 'modal' | 'modalSub' | 'drawer' | 'field' | 'section' | 'masthead' | 'card';

type CommonProps = {
  children: React.ReactNode;
  /** DOM-тег. По умолч. `h2`; `span` — когда заголовок инлайновый (напр. подпись
   *  активного таба внутри кнопки). */
  as?: 'h1' | 'h2' | 'h3' | 'span';
  className?: string;
};

// Ровно одно из role|size — обеспечивается типом (discriminated union), не дисциплиной.
type Props = CommonProps & ({ role: HeadingRole; size?: never } | { size: HeadingSize; role?: never });

/**
 * Canonical display heading — ОДИН Onest bold-sans голос (Apple Large Title).
 * Используй для любого section/overlay/masthead заголовка. serif-italic — НЕ
 * этот примитив (тихий указатель = Text variant="navTabQuiet").
 *
 * Целевой API — `role` (display/headline/title), композит из `--sys-text-*`.
 * `size` — legacy-шкала, держится как шим до миграции M2. Ровно одно из двух.
 */
const Heading = (props: Props) => {
  const { children, as = 'h2', className } = props;
  const Tag = as;
  const role = 'role' in props ? props.role : undefined;
  const size = 'size' in props ? props.size : undefined;
  const tierClass = role ? styles[role] : size ? styles[size] : undefined;
  const heading = <Tag className={clsx(styles.heading, tierClass, className)}>{children}</Tag>;
  // masthead несёт свою обёртку-<header> (отступ слайда + NavSwitcher hiding).
  if (size === 'masthead') {
    return <header className={styles.mastheadWrap}>{heading}</header>;
  }
  return heading;
};

export default Heading;
