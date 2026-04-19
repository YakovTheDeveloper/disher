import { useState } from 'react';
import clsx from 'clsx';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Quantity } from '@/shared/ui/Quantity';
import TimeChoose from '@/shared/ui/TimeChoose/TimeChoose';
import { modalStore, type BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import ModalConfirmation from '@/shared/ui/Modal/ModalConfirmation/ModalConfirmation';
import { openFreeTextFoodSearch } from '@/features/daySchedule/free-text-food/openFreeTextFoodSearch';
import styles from './FreeTextFoodReviewItem.module.scss';

interface MatchCandidate {
  id: string;
  name: string;
  score: number;
}

type ConfirmDeleteProps = BaseModalProps<boolean> & {
  action: string;
};

const ConfirmDeleteModal = ({ onClose, action }: ConfirmDeleteProps) => (
  <ModalLayout>
    <ModalConfirmation
      data={{ action }}
      onConfirm={() => onClose(true)}
      onClose={() => onClose(false)}
    />
  </ModalLayout>
);

interface FreeTextFoodReviewItemProps {
  item: {
    name: string;
    note: string;
    originalName: string;
    quantity: number;
    time: string;
    quantityGuessed?: boolean;
    productId?: string;
  };
  isAmbiguous?: boolean;
  isUnresolved?: boolean;
  candidates?: MatchCandidate[];
  selectedCandidateId?: string | null;
  onSelectCandidate?: (id: string) => void;
  onEditTime?: (time: string) => void;
  onEditFood?: (productId: string, name: string) => void;
  onEditQuantity?: (quantity: number) => void;
  onDeleteNote?: () => void;
  onDeleteItem?: () => void;
  onFindManually?: () => void;
}

export const FreeTextFoodReviewItem = ({
  item,
  isAmbiguous,
  isUnresolved,
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  onEditTime,
  onEditFood,
  onEditQuantity,
  onDeleteNote,
  onDeleteItem,
  onFindManually,
}: FreeTextFoodReviewItemProps) => {
  const [expandCandidates, setExpandCandidates] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [editingQuantity, setEditingQuantity] = useState(false);
  const hasNote = item.note.trim().length > 0;

  return (
    <div className={clsx(styles.root)}>
      <div className={styles.header}>
        {isAmbiguous && <div className={styles.ambiguousDot} title="Требует уточнения" />}
        {isUnresolved && <div className={styles.unresolvedDot} title="Не распознано" />}

        <div className={styles.timeGroup}>
          {editingTime ? (
            <TimeChoose
              initialTime={item.time}
              onFinish={(newTime: string) => {
                onEditTime?.(newTime);
                setEditingTime(false);
              }}
            />
          ) : (
            <button
              type="button"
              className={styles.time}
              onClick={() => setEditingTime(true)}
            >
              {item.time}
            </button>
          )}
        </div>

        <div className={styles.nameGroup}>
          <button
            type="button"
            className={styles.nameButton}
            onClick={async () => {
              const picked = await openFreeTextFoodSearch(item.originalName);
              if (picked) onEditFood?.(picked.id, picked.name);
            }}
          >
            <FoodName className={styles.name} content={{ name: item.name }} />
          </button>
          {hasNote && (
            <button
              type="button"
              className={styles.noteChip}
              onClick={onDeleteNote}
              title="Удалить уточнение"
            >
              <span className={styles.noteText}>{item.note}</span>
              <span className={styles.noteClose}>×</span>
            </button>
          )}
          {isAmbiguous && (
            <button
              type="button"
              className={styles.questionMark}
              onClick={() => setExpandCandidates(!expandCandidates)}
            >
              ?
            </button>
          )}
          {isUnresolved && !item.productId && (
            <button type="button" className={styles.findLink} onClick={onFindManually}>
              Найти
            </button>
          )}
        </div>

        <div className={styles.quantityGroup}>
          {editingQuantity ? (
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => {
                const newQty = parseInt(e.target.value) || item.quantity;
                onEditQuantity?.(newQty);
              }}
              onBlur={() => setEditingQuantity(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditingQuantity(false);
              }}
              autoFocus
              className={styles.quantityInput}
              min="1"
              max="9999"
            />
          ) : (
            <button
              type="button"
              className={styles.quantityButton}
              onClick={() => setEditingQuantity(true)}
            >
              <Quantity
                id={`qty-${item.productId}`}
                onClick={() => {}}
                content={{ quantity: item.quantity }}
                hide={false}
                unit="г"
                className={styles.quantity}
              />
            </button>
          )}
          {item.quantityGuessed && <span className={styles.guessed}>оценено</span>}
        </div>

        <button
          type="button"
          className={styles.deleteBtn}
          onClick={async () => {
            const confirmed = await modalStore.show(ConfirmDeleteModal, {
              action: 'удалить этот продукт?',
            });
            if (confirmed) onDeleteItem?.();
          }}
          title="Удалить элемент"
        >
          ×
        </button>
      </div>

      {isAmbiguous && expandCandidates && candidates && (
        <div className={styles.candidatesPanel}>
          {candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className={clsx(
                styles.candidateOption,
                candidate.id === selectedCandidateId && styles.candidateOptionActive
              )}
              onClick={() => {
                onSelectCandidate?.(candidate.id);
                setExpandCandidates(false);
              }}
            >
              <span className={styles.candidateName}>{candidate.name}</span>
              <span className={styles.candidateScore}>{candidate.score.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
