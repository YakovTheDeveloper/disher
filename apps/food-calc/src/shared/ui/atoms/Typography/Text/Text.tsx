import clsx from 'clsx';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './Text.module.scss';

/** Body-tier type variants. Grows over time.
 *  `hint` — calm helper text under a field/title.
 *  `navTabQuiet` — quiet serif-italic «museum-label» pointer: inactive
 *  nav-tabs / breadcrumb-style steps. This primitive is the single source of
 *  that voice — SwitcherTab / Breadcrumbs render <Text variant="navTabQuiet">. */
type TextVariant = 'hint' | 'navTabQuiet';

type Props = {
  children: ReactNode;
  /** Type role. New variants are added in `Text.module.scss`. */
  variant: TextVariant;
  /**
   * DOM tag — polymorphic. Defaults to `p`. Pass `span` for inline,
   * `button` / `label` / `a` when the text IS an interactive/semantic
   * element; extra props (onClick, aria-*, …) forward to it.
   */
  as?: ElementType;
  className?: string;
} & HTMLAttributes<HTMLElement>;

/**
 * Text — body-tier typography primitive, sibling of `Heading`. `Heading`
 * owns the italic-serif display voice; `Text` owns everything below it.
 * Every variant stays anchored to the `--text-*` token scale (or a shared
 * voice mixin). Polymorphic via `as` so a crumb-button or a label can carry
 * a variant without an extra wrapper element.
 */
const Text = ({ children, variant, as, className, ...rest }: Props) => {
  const Tag = as ?? 'p';
  return (
    <Tag className={clsx(styles.text, styles[variant], className)} {...rest}>
      {children}
    </Tag>
  );
};

export default Text;
