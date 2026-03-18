import { FC, useState } from 'react';
import clsx from 'clsx';
import { BrandMark } from '@/components/ui/BrandMark';
import Button from '@/components/ui/atoms/Button/Button';
import { Typography } from '@/components/ui/atoms/Typography';
import { RenameModal } from '@/components/features/shared/components/RenameModal';
import { modalStore } from '@/shared/ui/modal-store';
import s from './ChangeName.module.scss';

type Props = {
  entity: {
    name: string;
    changeName: (name: string) => void;
  };
  canRename?: boolean;
};

const ChangeName: FC<Props> = ({ entity, canRename = true }) => {
  const [showRenameHint, setShowRenameHint] = useState(false);

  const handleNameClick = () => {
    if (canRename) setShowRenameHint((prev) => !prev);
  };

  const handleRename = async () => {
    setShowRenameHint(false);
    const newName = await modalStore.show(RenameModal, { currentName: entity.name });

    if (newName) {
      entity.changeName(newName);
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
        <Typography variant="feature-title">{entity.name}</Typography>
      </div>
    </>
  );
};

export default ChangeName;
