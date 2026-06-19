import clsx from 'clsx';
import styles from './Heading.module.scss';

type Props = {
  children: React.ReactNode;
  /** Type-scale tier. `screen` — page header, `modal` — wizard-flow modal,
   *  `modalSub` — sub-heading inside a modal, `drawer` — drawer header,
   *  `field` — мелкий под-заголовок поля/секции (16px, ниже drawer),
   *  `section` — in-page section / sub-heading, `masthead` — крупная шапка
   *  слайда HomePage (рендерит обёртку-<header>). Все sizes делят один
   *  Onest bold-sans канон; меняется только font-size. */
  size: 'screen' | 'modal' | 'modalSub' | 'drawer' | 'field' | 'section' | 'masthead';
  /** DOM-тег. По умолч. `h2`; `span` — когда заголовок инлайновый (напр. подпись
   *  активного таба внутри кнопки). */
  as?: 'h1' | 'h2' | 'h3' | 'span';
  className?: string;
};

/**
 * Canonical display heading — ОДИН Onest bold-sans голос (Apple Large Title).
 * Используй для любого section/overlay/masthead заголовка. serif-italic — НЕ
 * этот примитив (тихий указатель = Text variant="navTabQuiet").
 */
const Heading = ({ children, size, as = 'h2', className }: Props) => {
  const Tag = as;
  const heading = (
    <Tag className={clsx(styles.heading, styles[size], className)}>{children}</Tag>
  );
  // masthead несёт свою обёртку-<header> (отступ слайда + NavSwitcher hiding).
  if (size === 'masthead') {
    return <header className={styles.mastheadWrap}>{heading}</header>;
  }
  return heading;
};

export default Heading;
