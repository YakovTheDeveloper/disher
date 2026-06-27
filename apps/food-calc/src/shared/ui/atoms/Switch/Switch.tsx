import clsx from 'clsx';
import styles from './Switch.module.scss';

export type SwitchProps = {
  checked: boolean;
  /** Called with the NEXT value when the user flips the switch. */
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  /** Accessible name — there is no visible label inside the control. */
  'aria-label'?: string;
};

// Accessible on/off toggle. No on/off switch existed before (SwitcherTab is
// tab-nav, LabeledCheckbox is a checkbox). A native `<button role="switch">`
// with a sliding thumb animated by `transform` only (composite-only budget —
// never width/left). Tokens mirror LabeledCheckbox / ConfirmDrawer
// (`--sys-card-text-active`, `--sys-color-surface-2`, …) — no bespoke tokens.
export function Switch({
  checked,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(styles.track, checked && styles.on)}
    >
      <span className={styles.thumb} aria-hidden="true" />
    </button>
  );
}

export default Switch;
