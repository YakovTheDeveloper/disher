import { useCallback, type ReactNode } from 'react';
import clsx from 'clsx';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import toaster from '@/shared/lib/toaster/toaster';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import type { UseWriteFoodFlowResult } from '../model/useWriteFoodFlow';
import styles from './WriteFoodButton.module.scss';

export interface WriteFoodButtonProps {
  flow: UseWriteFoodFlowResult;
  inputId: string;
  label?: string;
  /** Second text line rendered under `label` (idle state only). */
  subLabel?: string;
  /** Custom leading icon. Replaces the default SerifT in idle state. */
  icon?: ReactNode;
  className?: string;
  prominent?: boolean;
  dark?: boolean;
}

const InputModesIcon = () => (
  <svg
    className={styles.serifT}
    width="32"
    height="18"
    viewBox="0 0 32 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* keyboard body */}
    <rect
      x="0.6"
      y="4.4"
      width="11.8"
      height="9.2"
      rx="1.3"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    {/* row 1 — 5 mini keys */}
    <rect x="1.8" y="6.2" width="1.6" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    <rect x="3.7" y="6.2" width="1.6" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    <rect x="5.6" y="6.2" width="1.6" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    <rect x="7.5" y="6.2" width="1.6" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    <rect x="9.4" y="6.2" width="1.6" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    {/* row 2 — 5 mini keys */}
    <rect x="1.8" y="8.2" width="1.6" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    <rect x="3.7" y="8.2" width="1.6" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    <rect x="5.6" y="8.2" width="1.6" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    <rect x="7.5" y="8.2" width="1.6" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    <rect x="9.4" y="8.2" width="1.6" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    {/* spacebar */}
    <rect x="3.4" y="10.2" width="6.2" height="1.6" rx="0.3" stroke="currentColor" strokeWidth="0.9" />
    {/* divider slash */}
    <path
      d="M17.5 2 L15.5 16"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    {/* microphone capsule */}
    <rect
      x="22"
      y="2"
      width="4"
      height="8.4"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    {/* microphone stand bracket (U-arc under capsule) */}
    <path
      d="M20.5 8.5 a3.5 3.5 0 0 0 7 0"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      fill="none"
    />
    {/* microphone stem + foot */}
    <path
      d="M24 12 v 2.5 M22.5 14.5 h 3"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export const WriteFoodButton = ({
  flow,
  inputId,
  label = 'Описать еду',
  subLabel,
  icon,
  className,
  prominent,
  dark,
}: WriteFoodButtonProps) => {
  const online = useOnline();

  const handleLabelClick = useCallback(
    (e: React.MouseEvent<HTMLLabelElement>) => {
      // Ready: navigate straight to review instead of opening modal.
      if (flow.state === 'ready') {
        e.preventDefault();
        flow.goToReview();
        return;
      }

      // Offline + idle → show toast, prevent opening.
      if (flow.state === 'idle' && !online) {
        e.preventDefault();
        toaster.error('Нужен интернет для обработки текста');
      }
    },
    [flow, online],
  );

  const badgeCount =
    flow.state === 'ready' && flow.parseResult
      ? flow.parseResult.resolved.length +
        flow.parseResult.ambiguous.length +
        flow.parseResult.unresolved.length
      : 0;

  const disabled = flow.state === 'idle' && !online;
  const showStacked = flow.state === 'idle' && !disabled && Boolean(subLabel);

  const leadingIcon =
    flow.state === 'loading' ? (
      <span className={styles.iconSpin}>
        <Spinner size={16} />
      </span>
    ) : flow.state === 'idle' && icon ? (
      <span className={styles.iconSlot}>{icon}</span>
    ) : (
      <InputModesIcon />
    );

  return (
    <label
      htmlFor={inputId}
      onClick={handleLabelClick}
      className={clsx(
        styles.wrapper,
        styles.button,
        styles[`state_${flow.state}`],
        prominent && styles.prominent,
        disabled && styles.disabled,
        dark && styles.dark,
        showStacked && styles.stacked,
        className,
      )}
      aria-disabled={disabled || undefined}
    >
      {showStacked ? (
        <>
          <span className={styles.stackedTop}>
            {leadingIcon}
            <span className={styles.text}>{label}</span>
          </span>
          <span className={styles.subText}>{subLabel}</span>
        </>
      ) : (
        <>
          {leadingIcon}
          <span className={styles.text}>
            {flow.state === 'idle' && (disabled ? 'Нет сети' : label)}
            {flow.state === 'loading' && 'Обрабатываем'}
            {flow.state === 'ready' && 'К проверке'}
            {flow.state === 'error' && 'Повторить'}
          </span>
        </>
      )}

      {flow.state === 'ready' && badgeCount > 0 && (
        <span className={styles.badge}>{badgeCount}</span>
      )}
    </label>
  );
};

export default WriteFoodButton;
