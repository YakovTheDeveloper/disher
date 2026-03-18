import { useState, useRef, useEffect, FC } from 'react';
import Button from '@/components/ui/atoms/Button/Button';
import s from './RenameModal.module.scss';
import { BaseModalProps } from '@/shared/ui';

type Props = BaseModalProps<string> & {
  currentName: string;
  label?: string;
};

const RenameModal: FC<Props> = ({ currentName, label = 'название', onClose }) => {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // delay to allow modal animation to complete before focusing
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== currentName) {
      onClose(trimmed);
    } else {
      onClose(undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose(undefined);
  };

  return (
    <div className={s.overlay} onClick={() => onClose(undefined)}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <span className={s.label}>{label}</span>

        <input
          ref={inputRef}
          className={s.input}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={currentName}
        />

        <div className={s.actions}>
          <Button variant="ghost" onClick={() => onClose(undefined)}>
            отмена
          </Button>
          <Button variant="ghost" onClick={handleSubmit}>
            сохранить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;
