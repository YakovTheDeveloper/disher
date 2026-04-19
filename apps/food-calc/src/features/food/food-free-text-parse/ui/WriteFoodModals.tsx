import { useCallback, useState } from 'react';
import { WriteFoodModal } from './WriteFoodModal';
import type { UseWriteFoodFlowResult } from '../model/useWriteFoodFlow';

export interface WriteFoodModalsProps {
  flow: UseWriteFoodFlowResult;
  inputId: string;
  placeholder?: string;
}

export const WriteFoodModals = ({ flow, inputId, placeholder }: WriteFoodModalsProps) => {
  const [open, setOpen] = useState(false);

  const handleFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.id === inputId) setOpen(true);
    },
    [inputId],
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    input?.blur();
  }, [inputId]);

  return (
    <div onFocusCapture={handleFocusCapture}>
      <WriteFoodModal
        isExpanded={open}
        onClose={handleClose}
        flow={flow}
        placeholder={placeholder ?? ''}
        inputId={inputId}
      />
    </div>
  );
};

export default WriteFoodModals;
