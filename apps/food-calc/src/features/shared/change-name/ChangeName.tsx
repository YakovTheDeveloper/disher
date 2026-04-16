import { FC, ReactNode, useState, useCallback } from 'react';
import clsx from 'clsx';
import { Typography } from '@/shared/ui/atoms/Typography';
import { ChangeNameModal, CHANGE_NAME_INPUT_ID } from './ChangeNameModal';
import s from './ChangeName.module.scss';

type Props = {
  name: string;
  onChangeName: (name: string) => void;
  canRename?: boolean;
  /** Custom heading element rendered instead of the default Typography name row */
  heading?: ReactNode;
};

const ChangeName: FC<Props> = ({ name, onChangeName, canRename = true, heading }) => {
  const [showRenameHint, setShowRenameHint] = useState(false);
  const [renameStep, setRenameStep] = useState<'idle' | 'details'>('idle');

  const handleNameClick = () => {
    if (canRename) setShowRenameHint((prev) => !prev);
  };

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    const id = (e.target as HTMLElement).id;
    if (id === CHANGE_NAME_INPUT_ID) {
      setRenameStep('details');
      setShowRenameHint(false);
    }
  }, []);

  const handleClose = () => {
    setRenameStep('idle');
    setShowRenameHint(false);
  };

  return (
    <div onFocusCapture={handleFocusCapture}>
      {canRename && (
        <div className={s.actionRow}>
          <span className={clsx(s.renameButtonWrapper, showRenameHint && s.visible)}>
            <label
              htmlFor={CHANGE_NAME_INPUT_ID}
              onClick={(e) => {
                e.stopPropagation();
              }}
              style={{ cursor: 'pointer', fontSize: '1.5rem' }}
            >
              поменять название
            </label>
          </span>
        </div>
      )}
      {heading ? (
        <div onClick={handleNameClick}>{heading}</div>
      ) : (
        <div className={s.nameRow} onClick={handleNameClick}>
          <Typography variant="feature-title" className={s.name}>
            {name}
          </Typography>
        </div>
      )}
      <ChangeNameModal
        currentName={name}
        isExpanded={renameStep === 'details'}
        onClose={handleClose}
        onChangeName={(newName) => {
          onChangeName(newName);
          handleClose();
        }}
      />
    </div>
  );
};

export default ChangeName;
