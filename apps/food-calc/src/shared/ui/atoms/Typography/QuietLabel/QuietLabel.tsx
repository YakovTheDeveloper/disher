import clsx from 'clsx';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './QuietLabel.module.scss';

type Props = {
  children: ReactNode;
  /**
   * DOM tag — polymorphic. Defaults to `span`. Pass `button` when the label IS
   * an interactive crumb (onClick / aria-* forward to it, как в Breadcrumbs).
   */
  as?: ElementType;
  className?: string;
} & HTMLAttributes<HTMLElement>;

/**
 * QuietLabel — тихий serif-italic указатель «музейная табличка»: неактивный
 * nav-таб (SwitcherTab) и шаг-крошка (Breadcrumbs). ЕДИНСТВЕННЫЙ источник этого
 * голоса в проекте. Раньше жил как navTabQuiet-голос `<Text>`; ось `variant`
 * у `Text` убрана 2026-06-24 (Text стал role-only, как Heading), а голос —
 * ортогональный serif тихого мелкого яруса — вынесен в собственный примитив
 * (project_design_dna: «голос инкапсулирован в примитиве», не в компонентных
 * scss). Цвет + opacity — часть голоса (тихий = приглушённый), поэтому живут
 * здесь, а не у консумера.
 */
const QuietLabel = ({ children, as, className, ...rest }: Props) => {
  const Tag = as ?? 'span';
  return (
    <Tag className={clsx(styles.quietLabel, className)} {...rest}>
      {children}
    </Tag>
  );
};

export default QuietLabel;
