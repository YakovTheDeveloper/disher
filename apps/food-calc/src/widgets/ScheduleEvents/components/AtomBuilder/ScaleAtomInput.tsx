/**
 * ScaleAtomInput — the single scale form (1–10 + phenomenon label).
 *
 * Scale is the ONLY manually-entered atom (2026-06-12). The value lives in the
 * draft store as `pendingScale`; there is NO «Добавить» button — the modal's
 * «Готово»/close commits it via `commitPendingScale` (one button, no data loss).
 * `setPendingScale` flips `touched`, so an untouched default never attaches a
 * phantom 5/10 to an event that the user only described in words.
 *
 * Renders directly inside the Оценка modal — no own header/footer.
 */

import { useEffect, useRef } from 'react';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { Chip } from '@/shared/ui/atoms/Chip';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import styles from './shared/AtomInputShared.module.css';

const PRESET_LABELS = ['Боль', 'Настроение', 'Энергия', 'Стресс', 'Тревога', 'Нагрузка'];

export const ScaleAtomInput = () => {
  const value = useEventDraftStore((s) => s.pendingScale.value);
  const label = useEventDraftStore((s) => s.pendingScale.label);
  const setPendingScale = useEventDraftStore((s) => s.setPendingScale);
  const numberRef = useRef<HTMLInputElement>(null);

  // Autofocus WITHOUT scrolling — a focus-driven scroll mid-modal-transition
  // jumps the whole sheet. preventScroll keeps the caret put.
  useEffect(() => {
    numberRef.current?.focus({ preventScroll: true });
  }, []);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setPendingScale({ value: '' });
      return;
    }
    setPendingScale({ value: Math.min(10, Math.max(1, Number(raw))) });
  };

  return (
    <div className={styles.atomPanel}>
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
            onFocus={(e) => e.target.select()}
          />
          <AutoGrowSearch
            className={styles.scaleCustomField}
            singleLine
            placeholder="Явление"
            value={label}
            onChange={(v) => setPendingScale({ label: v })}
          />
        </div>

        {/* Row 2 — preset chips. A tap replaces the text field's value. */}
        <div className={styles.scaleChipsRow}>
          {PRESET_LABELS.map((item) => (
            <Chip
              key={item}
              active={label.trim() === item}
              // Prevent the tap from blurring the focused input — keeps the
              // keyboard up (no viewport reshuffle) so the chip activates
              // instantly instead of after the keyboard-dismiss animation.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setPendingScale({ label: item })}
            >
              {item}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
};

ScaleAtomInput.displayName = 'ScaleAtomInput';
