import clsx from 'clsx';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './Text.module.scss';

/** Семантические типо-РОЛИ body-яруса (ярус sys · типографика, пресет «сист»
 *  5dbbbf43; ground truth tds/typography-roles-system.md). Композит family+size+
 *  weight+lh+tracking из `--sys-text-*` через mixin `text-role()`. Это целевой
 *  API тела/мелкого яруса; `variant` ниже — голоса (serif-italic + hint). */
type TextRole = 'body' | 'label' | 'caption';

/** Body-tier «голоса» (ортогональны размерным ролям). Grows over time.
 *  `hint` — calm helper text under a field/title.
 *  `navTabQuiet` — quiet serif-italic «museum-label» pointer: inactive
 *  nav-tabs / breadcrumb-style steps. This primitive is the single source of
 *  that voice — SwitcherTab / Breadcrumbs render <Text variant="navTabQuiet">.
 *  `sectionLabel` — serif-italic, medium, dark-grey title for a nutrient-section
 *  header (NutrientTable / NutrientPickerDrawer). Single source of that look.
 *  (FieldLabel flipped to role="label" sans on 2026-06-23 — no longer here.) */
type TextVariant = 'hint' | 'navTabQuiet' | 'sectionLabel';

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

// Ровно одно из role|variant — обеспечивается типом (discriminated union).
type Props = CommonProps & ({ role: TextRole; variant?: never } | { variant: TextVariant; role?: never });

/**
 * Text — body-tier typography primitive, sibling of `Heading`. `Heading`
 * owns the display roles; `Text` owns the body roles (body/label/caption) via
 * the target `role` API (composite from `--sys-text-*`), плюс «голоса» через
 * `variant` (serif-italic тихий ярус + hint). Ровно одно из role|variant.
 * Polymorphic via `as` so a crumb-button or a label can carry a role/variant
 * without an extra wrapper element.
 */
const Text = ({ children, as, className, ...rest }: Props) => {
  const Tag = as ?? 'p';
  const { role, variant, ...domProps } = rest as {
    role?: TextRole;
    variant?: TextVariant;
  } & HTMLAttributes<HTMLElement>;
  const tierClass = role ? styles[role] : variant ? styles[variant] : undefined;
  return (
    <Tag className={clsx(styles.text, tierClass, className)} {...domProps}>
      {children}
    </Tag>
  );
};

export default Text;
