/**
 * TimeAtomInput - Fullscreen input for time atoms
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

          {mode === 'duration' ? (
            <div>
              <label>Длительность (минуты)</label>
              <input
                id={inputId}
                type="number"
                min="1"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
              />
            </div>
          ) : (
            <div>
              <label>Конец</label>
              <input
                id={inputId}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          )}

          <div>
            <label>Тип времени</label>
            <div className={styles.radioGroup}>
              <label>
                <input
                  type="radio"
                  value="duration"
                  checked={mode === 'duration'}
                  onChange={(e) => setMode(e.target.value as TimeMode)}
                />
                Длительность
              </label>
              <label>
                <input
                  type="radio"
                  value="end"
                  checked={mode === 'end'}
                  onChange={(e) => setMode(e.target.value as TimeMode)}
                />
                Конец
              </label>
            </div>
          </div>

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
