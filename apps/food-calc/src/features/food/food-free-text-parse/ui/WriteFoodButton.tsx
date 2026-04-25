import { useCallback } from 'react';
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
  className?: string;
}

const SerifTIcon = () => (
  <svg
    className={styles.serifT}
    width="14"
    height="16"
    viewBox="0 0 14 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* top serif bar */}
    <path d="M1 2h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    {/* top-left serif tick */}
    <path d="M1 2v1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    {/* top-right serif tick */}
    <path d="M13 2v1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    {/* vertical stem */}
    <path d="M7 2.2v11.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* bottom serif bar */}
    <path d="M4.4 14h5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const WriteFoodButton = ({
  flow,
  inputId,
  label = 'Описать еду',
  className,
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

  return (
    <label
      htmlFor={inputId}
      onClick={handleLabelClick}
      className={clsx(
        styles.wrapper,
        styles.button,
        styles[`state_${flow.state}`],
        disabled && styles.disabled,
        className,
      )}
      aria-disabled={disabled || undefined}
    >
      {flow.state === 'loading' ? (
        <span className={styles.iconSpin}>
          <Spinner size={16} />
        </span>
      ) : (
        <SerifTIcon />
      )}

      <span className={styles.text}>
        {flow.state === 'idle' && (disabled ? 'Нет сети' : label)}
        {flow.state === 'loading' && 'Обрабатываем'}
        {flow.state === 'ready' && 'К проверке'}
        {flow.state === 'error' && 'Повторить'}
      </span>

      {flow.state === 'ready' && badgeCount > 0 && (
        <span className={styles.badge}>{badgeCount}</span>
      )}
    </label>
  );
};

export default WriteFoodButton;
