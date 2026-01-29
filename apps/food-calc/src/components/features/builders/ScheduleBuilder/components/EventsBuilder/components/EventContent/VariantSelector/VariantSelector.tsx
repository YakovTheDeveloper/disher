import React from 'react';
import styles from './VariantSelector.module.scss';

const variantOptions: string[] = ['sleep', 'mood', 'energy', 'activity', 'note', 'digestion'];

interface Props {
  onSelect: (variant: string) => void;
}

const VariantSelector: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className={styles.variantList}>
      {variantOptions.map((variant) => (
        <button key={variant} className={styles.variantButton} onClick={() => onSelect(variant)}>
          {variant}
        </button>
      ))}
    </div>
  );
};

export default VariantSelector;
