/**
 * PresetChips - Reusable preset selection chips
 */

import React from 'react';
import styles from './AtomInputShared.module.css';

export interface PresetChipsProps {
  presets: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const PresetChips: React.FC<PresetChipsProps> = ({
  presets,
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`${styles.presetLabels} ${className}`}>
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          className={`${styles.presetChip} ${value === preset ? styles.active : ''}`}
          onClick={() => onChange(preset)}
        >
          {preset}
        </button>
      ))}
    </div>
  );
};

PresetChips.displayName = 'PresetChips';
