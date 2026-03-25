/**
 * ScaleAtomInput - Fullscreen input for scale atoms (1-10 ratings)
 *
 * Horizontal snap-scroll wheel picker for one-handed mobile use.
 * Large centered number, swipe left/right to change value.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ScaleAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { AtomModalFooter, PresetChips } from './shared';
import styles from './shared/AtomInputShared.module.css';

export interface ScaleAtomInputProps {
  onAddAtom: (atom: ScaleAtom) => void;
  onClose: () => void;
  accentColor?: string;
  inputId?: string;
}

const PRESET_LABELS = ['боль', 'настроение', 'энергия', 'стресс', 'тревога', 'нагрузка'];
const SCALE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ITEM_WIDTH = 64;

export const ScaleAtomInput = ({ onAddAtom, onClose, accentColor, inputId }: ScaleAtomInputProps) => {
  const [value, setValue] = useState(5);
  const [label, setLabel] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const handleAdd = () => {
    onAddAtom({
      kind: 'scale',
      value,
      label: label || undefined,
    });
  };

  const scrollToValue = useCallback((v: number, smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const containerWidth = el.offsetWidth;
    const targetScroll = (v - 1) * ITEM_WIDTH - (containerWidth / 2 - ITEM_WIDTH / 2);
    el.scrollTo({ left: targetScroll, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    // Initial scroll to default value without animation
    requestAnimationFrame(() => scrollToValue(value, false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const containerWidth = el.offsetWidth;
    const centerOffset = el.scrollLeft + containerWidth / 2;
    const snappedIndex = Math.round((centerOffset - ITEM_WIDTH / 2) / ITEM_WIDTH);
    const clamped = Math.max(0, Math.min(9, snappedIndex));
    const newValue = SCALE_VALUES[clamped];
    if (newValue !== undefined && newValue !== value) {
      setValue(newValue);
    }
  }, [value]);

  const handleScrollEnd = useCallback(() => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;
    requestAnimationFrame(() => {
      scrollToValue(value);
      isScrollingRef.current = false;
    });
  }, [value, scrollToValue]);

  return (
    <ModalShell>
      <ModalShell.Body>
        <div
          className={styles.atomModalContent}
          style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
        >
          <h3 className={styles.title}>Оценка</h3>

          {/* Hidden focusable input for label→input pattern */}
          <input id={inputId} className={styles.hiddenFocus} tabIndex={-1} readOnly />

          {/* Large centered value display */}
          <output className={styles.scaleValueDisplay}>{value}</output>

          {/* Horizontal snap-scroll wheel */}
          <div
            ref={scrollRef}
            className={styles.scaleWheel}
            onScroll={handleScroll}
            onTouchEnd={handleScrollEnd}
            onMouseUp={handleScrollEnd}
          >
            <div className={styles.scaleWheelTrack}>
              {SCALE_VALUES.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`${styles.scaleWheelItem} ${v === value ? styles.active : ''}`}
                  onClick={() => { setValue(v); scrollToValue(v); }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label>Для чего? (опционально)</label>
            <input
              type="text"
              placeholder="боль, настроение, энергия..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <PresetChips presets={PRESET_LABELS} value={label} onChange={setLabel} />
          </div>

          <AtomModalFooter onCancel={onClose} onAdd={handleAdd} accentColor={accentColor} />
        </div>
      </ModalShell.Body>
    </ModalShell>
  );
};

ScaleAtomInput.displayName = 'ScaleAtomInput';
