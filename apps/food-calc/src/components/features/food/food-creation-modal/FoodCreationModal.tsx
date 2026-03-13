import { useState } from 'react';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import styles from './FoodCreationModal.module.scss';

type Props = {
  isOpen: boolean;
  inputId: string;
  createButton: (name: string, onDone: () => void) => React.ReactNode;
};

const FoodCreationModal = ({ isOpen, inputId, createButton }: Props) => {
  const [name, setName] = useState('');

  const handleDone = () => {
    setName('');
  };

  return (
    <SearchFormExpandable
      position="absolute"
      isExpanded={isOpen}
      content={
        <div>
          <input
            id={inputId}
            className={styles.nameInput}
            type="text"
            placeholder="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className={styles.actions}>
            {createButton(name.trim(), handleDone)}
          </div>
        </div>
      }
    />
  );
};

export default FoodCreationModal;
