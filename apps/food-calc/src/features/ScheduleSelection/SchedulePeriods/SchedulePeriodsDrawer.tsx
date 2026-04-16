import { useRef, useEffect, useCallback } from 'react';
import { SchedulePeriods } from './SchedulePeriods';

interface Props {
  date: string;
  inputId: string;
  onClose?: () => void;
  onPeriodCreated?: (periodId: string) => void;
}

export const SchedulePeriodsModal = ({ date, inputId, onClose, onPeriodCreated }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when component mounts/updates
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handlePeriodCreated = useCallback((periodId: string) => {
    if (onPeriodCreated) {
      onPeriodCreated(periodId);
    }
  }, [onPeriodCreated]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '2px',
          height: '2px',
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      <SchedulePeriods
        date={date}
        onClose={handleClose}
        onPeriodCreated={handlePeriodCreated}
      />
    </div>
  );
};
