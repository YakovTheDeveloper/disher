import { useState } from 'react';
import clsx from 'clsx';
import { FoodName } from '@/shared/ui/atoms/Typography/FoodName';
import { Quantity } from '@/shared/ui/Quantity';
import styles from './FreeTextFoodReviewItem.module.scss';

interface MatchCandidate {
  id: string;
  name: string;
  score: number;
}

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
  onDeleteNote,
  onDeleteItem,
  onFindManually,
}: FreeTextFoodReviewItemProps) => {
  const [expandCandidates, setExpandCandidates] = useState(false);
  const hasNote = item.note.trim().length > 0;

  return (
    <div className={clsx(styles.root)}>
      <div className={styles.header}>
        {isAmbiguous && (
          <div className={styles.ambiguousDot} title="Требует уточнения" />
        )}
        {isUnresolved && (
          <div className={styles.unresolvedDot} title="Не распознано" />
        )}

        <div className={styles.timeGroup}>
          <span className={styles.time}>{item.time}</span>
        </div>

        <div className={styles.nameGroup}>
          <FoodName className={styles.name}>{item.name}</FoodName>
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
            <button
              type="button"
              className={styles.findLink}
              onClick={onFindManually}
            >
              Найти
            </button>
          )}
        </div>

        <div className={styles.quantityGroup}>
          <Quantity className={styles.quantity}>
            {item.quantity} г
            {item.quantityGuessed && <span className={styles.guessed}>оценено</span>}
          </Quantity>
        </div>

        <button
          type="button"
          className={styles.deleteBtn}
          onClick={onDeleteItem}
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
                candidate.id === selectedCandidateId && styles.candidateOptionActive,
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
