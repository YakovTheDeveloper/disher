import clsx from 'clsx';
import styles from './ScrollIndicator.module.scss';

type Props = {
  visible: boolean;
  variant?: 'light' | 'dark';
  /**
   * Full-bleed to the screen edges: negates the host's page inset (default
   * `--sys-inset-page` = 12, override via `--scroll-indicator-bleed`) so the fade
   * spans edge-to-edge instead of being boxed by the modal frame's side padding.
   * Opt-in — `Screen` leaves it off.
   */
  bleed?: boolean;
};

export const ScrollIndicator = ({ visible, variant = 'light', bleed = false }: Props) => (
  <div
    className={clsx(
      styles.indicator,
      styles[variant],
      bleed && styles.bleed,
      visible && styles.visible
    )}
  />
);
