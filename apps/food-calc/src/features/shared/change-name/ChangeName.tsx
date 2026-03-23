import { FC, useState } from 'react';
import clsx from 'clsx';
import { BrandMark } from '@/shared/ui/BrandMark';
import Button from '@/shared/ui/atoms/Button/Button';
import { Typography } from '@/shared/ui/atoms/Typography';
import { RenameModal } from './RenameModal';
import { modalStore } from '@/shared/ui/modal-store';
import s from './ChangeName.module.scss';

type Props = {
  name: string;
  onChangeName: (name: string) => void;
  canRename?: boolean;
};

const ChangeName: FC<Props> = ({ name, onChangeName, canRename = true }) => {
  const [showRenameHint, setShowRenameHint] = useState(false);

  const handleNameClick = () => {
    if (canRename) setShowRenameHint((prev) => !prev);
  };

  const handleRename = async () => {
    setShowRenameHint(false);
    const newName = await modalStore.show(RenameModal, { currentName: name });

    if (newName) {
      onChangeName(newName);
    }
  };

  return (
    <>
      {canRename && (
        <div className={s.actionRow}>
          <BrandMark size={40} variant="wave" className={s.brandMarkClickable} />
          <span className={clsx(s.renameButton, showRenameHint && s.visible)}>
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handleRename();
              }}
            >
              поменять название
            </Button>
          </span>
        </div>
      )}
      <div className={s.nameRow} onClick={handleNameClick}>
        <Typography variant="feature-title" className={s.name}>{name}</Typography>
      </div>
    </>
  );
};

export default ChangeName;
