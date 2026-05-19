/**
 * ScaleAtomInput — 1–10 scale rating with phenomenon label.
 *
 * Keyboard-first layout: value number pinned top-left, preset chips +
 * custom-value field top-right. Everything lives in the top zone so the
 * keyboard (numeric for the value, text for the custom field) never
 * covers the chips — the «явление» choice stays one tap away.
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
  accentColor?: string;
}

const PRESET_LABELS = ['Боль', 'Настроение', 'Энергия', 'Стресс', 'Тревога', 'Нагрузка'];

export const ScaleAtomInput = ({ onAddAtom, onClose, accentColor }: ScaleAtomInputProps) => {
  const [value, setValue] = useState<number | ''>(5);
  // Single-select label: either one preset OR a custom string — never both.
  const [preset, setPreset] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const [isReady, setIsReady] = useState(false);
  const numberRef = useRef<HTMLInputElement>(null);

  // Autofocus WITHOUT scrolling. The plain `autoFocus` attribute lets the
  // browser scroll the input into view — if the panel mounts mid-step-
  // transition that scroll jumps the whole modal. preventScroll keeps the
  // caret where it is.
  useEffect(() => {
    numberRef.current?.focus({ preventScroll: true });
  }, []);

  const label = custom.trim() || preset || undefined;

  const handleAdd = () => {
    onAddAtom({ kind: 'scale', value: value || 5, label });
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

  const selectPreset = (next: string) => {
    setPreset(next);
    setCustom('');
  };

  const handleCustomChange = (next: string) => {
    setCustom(next);
    if (next.trim()) setPreset(null);
  };

  return (
    <div
      className={styles.atomPanel}
      style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
    >
      <ModalHeader title="Шкала 1–10" onBack={onClose} />
      <div className={styles.scalePanelBody}>
        <div className={styles.scaleTopZone}>
          {/* Value — top-left */}
          <div className={styles.scaleValueBlock}>
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
            <div className={styles.scaleNumberUnderline} />
          </div>

          {/* Preset chips + custom-value field — top-right */}
          <div className={styles.scaleChipsArea}>
            {PRESET_LABELS.map((item) => (
              <Chip
                key={item}
                className={styles.scaleChip}
                active={preset === item}
                // Prevent the tap from blurring the focused input: keeps the
                // keyboard up (no viewport reshuffle) so the chip activates
                // instantly instead of after the keyboard-dismiss animation.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPreset(item)}
              >
                {item}
              </Chip>
            ))}
            <AutoGrowSearch
              className={styles.scaleCustomField}
              singleLine
              placeholder="Или выберите свой вариант"
              value={custom}
              onChange={handleCustomChange}
              onFocus={() => setIsReady(true)}
            />
          </div>
        </div>
      </div>

      {isReady && (
        <ModalShell.ActionButtons
          right={
            <ModalNextButton
              onClick={handleAdd}
              variant="finish"
              theme="events"
              label="Добавить"
            />
          }
        />
      )}
    </div>
  );
};

ScaleAtomInput.displayName = 'ScaleAtomInput';
