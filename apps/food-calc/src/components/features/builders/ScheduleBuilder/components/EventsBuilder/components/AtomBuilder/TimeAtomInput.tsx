/**
 * TimeAtomInput - Input component for time atoms
 */

import { useState } from 'react';
import { TimeAtom } from '@/entities/schedule-event';
import { AtomInputLayout, AtomActionButtons } from './shared';

export interface TimeAtomInputProps {
  onAddAtom: (atom: TimeAtom) => void;
  onClose: () => void;
}

type TimeMode = 'duration' | 'end';

/**
 * TimeAtomInput Component
 *
 * Allows user to add a time atom
 */
export const TimeAtomInput = ({ onAddAtom, onClose }: TimeAtomInputProps) => {
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
    <AtomInputLayout title="Добавить время">
      <div>
        <label>Тип времени</label>
        <div>
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

      {mode === 'duration' && (
        <div>
          <label>Длительность (минуты)</label>
          <input
            type="number"
            min="1"
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
          />
        </div>
      )}

      {mode === 'end' && (
        <div>
          <label>Конец</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      )}

      <AtomActionButtons onCancel={onClose} onAdd={handleAdd} />
    </AtomInputLayout>
  );
};

/**
 * Convert time string (HH:MM) to milliseconds since today start
 */
function timeToMs(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const today = new Date();
  today.setHours(hours, minutes, 0, 0);
  return today.getTime();
}

TimeAtomInput.displayName = 'TimeAtomInput';
