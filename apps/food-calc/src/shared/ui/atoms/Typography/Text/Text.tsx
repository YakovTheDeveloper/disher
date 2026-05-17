import clsx from 'clsx';
import styles from './Text.module.scss';

/** Body-tier type variants. Grows over time — `hint` is the first. */
type TextVariant = 'hint';

type Props = {
  children: React.ReactNode;
  /**
   * Type role. `hint` — small, calm helper text under a field or an
   * overlay title. New variants are added in `Text.module.scss`.
   */
  variant: TextVariant;
  /** DOM tag. Defaults to `p`; use `span` for inline text. */
  as?: 'p' | 'span' | 'div';
  className?: string;
};

/**
 * Text — body-tier typography primitive, sibling of `Heading`. `Heading`
 * owns the italic-serif display voice; `Text` owns everything below it.
 * Every variant stays anchored to the `--text-*` token scale.
 */
const Text = ({ children, variant, as = 'p', className }: Props) => {
  const Tag = as;
  return <Tag className={clsx(styles.text, styles[variant], className)}>{children}</Tag>;
};

export default Text;
