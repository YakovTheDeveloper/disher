/**
 * TimeAtomInput - Fullscreen input for time atoms
 *
 * Segment control for mode switching + preset duration chips for quick one-tap selection.
 */

import { useState } from 'react';
import { TimeAtom } from '@/entities/schedule-event';
import { ModalShell } from '@/shared/ui/ModalShell';
import { AtomModalFooter } from './shared';
import styles from './shared/AtomInputShared.module.css';

export interface TimeAtomInputProps {
  onAddAtom: (atom: TimeAtom) => void;
  onClose: () => void;
  accentColor?: string;
  inputId?: string;
}

type TimeMode = 'duration' | 'end';

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export const TimeAtomInput = ({ onAddAtom, onClose, accentColor, inputId }: TimeAtomInputProps) => {
  const [mode, setMode] = useState<TimeMode>('duration');
  const [durationMin, setDurationMin] = useState(30);
  const [endTime, setEndTime] = useState('13:00');

  const handleAdd = () => {
    const atom: TimeAtom = { kind: 'time' };
    if (mode === 'duration') {
      atom.durationMin = durationMin;
    } else if (mode === 'end') {
      atom.end = timeToMs(endTime);
    }
    onAddAtom(atom);
  };

  return (
    <ModalShell>
      <ModalShell.Body>
        <div
          className={styles.atomModalContent}
          style={accentColor ? ({ '--atom-accent': accentColor } as React.CSSProperties) : undefined}
        >
          <h3 className={styles.title}>Добавить время</h3>

          {/* Hidden focusable input for label→input pattern */}
          <input id={inputId} className={styles.hiddenFocus} tabIndex={-1} readOnly />

          {/* Segment control — two large tabs */}
          <div className={styles.segmentControl}>
            <button
              type="button"
              className={`${styles.segmentItem} ${mode === 'duration' ? styles.active : ''}`}
              onClick={() => setMode('duration')}
            >
              Длительность
            </button>
            <button
              type="button"
              className={`${styles.segmentItem} ${mode === 'end' ? styles.active : ''}`}
              onClick={() => setMode('end')}
            >
              Конец
            </button>
          </div>

          {mode === 'duration' ? (
            <>
              {/* Preset duration chips — one tap */}
              <div className={styles.tagSuggestionsTop}>
                {DURATION_PRESETS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    className={`${styles.quickChip} ${durationMin === min ? styles.active : ''}`}
                    onClick={() => setDurationMin(min)}
                  >
                    {min >= 60 ? `${min / 60}ч` : `${min}м`}
                  </button>
                ))}
              </div>

              <div>
                <label>Или введите минуты</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                />
              </div>
            </>
          ) : (
            <div>
              <label>Конец</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          )}

          <AtomModalFooter onCancel={onClose} onAdd={handleAdd} accentColor={accentColor} />
        </div>
      </ModalShell.Body>
    </ModalShell>
  );
};

function timeToMs(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const today = new Date();
  today.setHours(hours, minutes, 0, 0);
  return today.getTime();
}

TimeAtomInput.displayName = 'TimeAtomInput';
