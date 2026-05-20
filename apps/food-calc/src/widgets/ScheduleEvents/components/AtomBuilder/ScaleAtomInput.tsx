/**
 * ScaleAtomInput — 1–10 scale rating with phenomenon label.
 *
 * Keyboard-first layout: the value number and the phenomenon text field
 * share the first row (baseline-aligned); preset chips sit on the second
 * row. A chip tap just fills the text field — the field is the single
 * source of the label.
 *
 * Renders inline (no ModalShell), fills parent flex container.
 */

import { useEffect, useRef, useState } from 'react';
import { ScaleAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { ModalHeader } from '@/shared/ui/ModalHeader';
import { Chip } from '@/shared/ui/atoms/Chip';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import styles from './shared/AtomInputShared.module.css';

export interface ScaleAtomInputProps {
  onAddAtom: (atom: ScaleAtom) => void;
  onClose: () => void;
}

const PRESET_LABELS = ['Боль', 'Настроение', 'Энергия', 'Стресс', 'Тревога', 'Нагрузка'];

export const ScaleAtomInput = ({ onAddAtom, onClose }: ScaleAtomInputProps) => {
  const [value, setValue] = useState<number | ''>(5);
  const [label, setLabel] = useState('');
  const [isReady, setIsReady] = useState(false);
  const numberRef = useRef<HTMLInputElement>(null);

  // Autofocus WITHOUT scrolling. The plain `autoFocus` attribute lets the
  // browser scroll the input into view — if the panel mounts mid-step-
  // transition that scroll jumps the whole modal. preventScroll keeps the
  // caret where it is.
  useEffect(() => {
    numberRef.current?.focus({ preventScroll: true });
  }, []);

  const handleAdd = () => {
    onAddAtom({ kind: 'scale', value: value || 5, label: label.trim() || undefined });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setValue('');
      return;
    }
    const n = Math.min(10, Math.max(1, Number(raw)));
    setValue(n);
  };

  return (
    <div className={styles.atomPanel}>
      <ModalHeader title="Шкала 1–10" onBack={onClose} size="compact" />
      <div className={styles.scalePanelBody}>
        {/* Row 1 — value number + phenomenon text field, baseline-aligned. */}
        <div className={styles.scaleFirstRow}>
          <input
            ref={numberRef}
            className={styles.scaleNumberInput}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={handleValueChange}
            onFocus={(e) => {
              setIsReady(true);
              e.target.select();
            }}
          />
          <AutoGrowSearch
            className={styles.scaleCustomField}
            singleLine
            placeholder="Явление"
            value={label}
            onChange={setLabel}
            onFocus={() => setIsReady(true)}
          />
        </div>

        {/* Row 2 — preset chips. A tap replaces the text field's value. */}
        <div className={styles.scaleChipsRow}>
          {PRESET_LABELS.map((item) => (
            <Chip
              key={item}
              active={label.trim() === item}
              // Prevent the tap from blurring the focused input: keeps the
              // keyboard up (no viewport reshuffle) so the chip activates
              // instantly instead of after the keyboard-dismiss animation.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setLabel(item)}
            >
              {item}
            </Chip>
          ))}
        </div>
      </div>

      {isReady && (
        <ModalShell.ActionButtons
          right={<ModalNextButton onClick={handleAdd} variant="finish" label="Добавить" />}
        />
      )}
    </div>
  );
};

ScaleAtomInput.displayName = 'ScaleAtomInput';
