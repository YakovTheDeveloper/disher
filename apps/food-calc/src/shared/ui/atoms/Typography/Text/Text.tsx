import clsx from 'clsx';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './Text.module.scss';

/** Семантические типо-РОЛИ body-яруса (ярус sys · типографика, пресет «сист»
 *  5dbbbf43; ground truth tds/typography-roles-system.md). Композит family+size+
 *  weight+lh+tracking из `--sys-text-*` через mixin `text-role()`. Это ЕДИНСТВЕННЫЙ
 *  API тела/мелкого яруса — ось `variant` (hint/navTabQuiet/sectionLabel) убрана
 *  2026-06-24 (Text стал role-only, как Heading): hint→role="caption",
 *  navTabQuiet→примитив <QuietLabel>, sectionLabel→<Heading role="title">. */
type TextRole = 'body' | 'label' | 'caption';

type CommonProps = {
  children: ReactNode;
  /**
   * DOM tag — polymorphic. Defaults to `p`. Pass `span` for inline,
   * `button` / `label` / `a` when the text IS an interactive/semantic
   * element; extra props (onClick, aria-*, …) forward to it.
   */
  as?: ElementType;
  /** Forwarded to the tag — set when `as="label"` so the text IS a form label
   *  (used by FieldLabel). Lives outside HTMLAttributes, hence declared here. */
  htmlFor?: string;
  className?: string;
} & HTMLAttributes<HTMLElement>;

type Props = CommonProps & { role: TextRole };

/**
 * Text — body-tier typography primitive, sibling of `Heading`. `Heading`
 * owns the display roles; `Text` owns the body roles (body/label/caption) via
 * the `role` API (composite from `--sys-text-*`). Role-only, как Heading — ось
 * `variant` убрана 2026-06-24 (голоса инкапсулированы в собственных примитивах:
 * тихий указатель = <QuietLabel>, заголовок секции = <Heading role="title">).
 * Polymorphic via `as` so a crumb-button or a label can carry a role without an
 * extra wrapper element.
 */
const Text = ({ children, as, className, ...rest }: Props) => {
  const Tag = as ?? 'p';
  const { role, ...domProps } = rest as { role: TextRole } & HTMLAttributes<HTMLElement>;
  return (
    <Tag className={clsx(styles.text, styles[role], className)} {...domProps}>
      {children}
    </Tag>
  );
};

export default Text;
