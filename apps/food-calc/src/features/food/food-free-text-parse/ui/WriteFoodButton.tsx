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
      {flow.state === 'loading' && (
        <span className={styles.iconSpin}>
          <Spinner size={16} />
        </span>
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
