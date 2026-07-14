/**
 * ScaleAtomInput — the single scale form (1–10 + phenomenon label).
 *
 * Scale is the ONLY manually-entered atom (2026-06-12). The value lives in the
 * draft store as `pendingScale`. The modal's «Готово»/close commits it via
 * `commitPendingScale`, so a user entering ONE state never needs to press
 * anything here; the optional `action` slot («Добавить состояние») is only for
 * committing a state and starting the next one.
 * `setPendingScale` flips `touched`, so an untouched default never attaches a
 * phantom 5/10 to an event that the user only described in words.
 *
 * Renders directly inside the Оценка modal — no own header/footer.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { useEventDraftStore } from '@/entities/schedule-event/model/draft';
import { ChoiceGroup, ChoiceItem } from '@/shared/ui/atoms/Choice';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import styles from './shared/AtomInputShared.module.css';

const PRESET_LABELS = ['Боль', 'Настроение', 'Энергия', 'Стресс', 'Тревога', 'Нагрузка'];

interface ScaleAtomInputProps {
  /**
   * Focus the value field on mount. Default `true` — the fullscreen Оценка modal
   * wants the numpad up immediately. The inline write-bar panel passes `false`:
   * it opens keyboard-DOWN (it sits in the keyboard's place), and a focus here
   * would raise the numpad and break that swap. The keyboard appears only when
   * the user taps a field.
   */
  autoFocusValue?: boolean;
  /**
   * Commit-affordance («Добавить состояние»), rendered INSIDE the form — right
   * under the preset row, next to what it commits. It must not live in the
   * builder's outer flex column: `.scalePanelBody` is `flex:1`, so anything
   * after it gets pushed to the bottom of the screen — onto the modal footer's
   * «Готово ✓», which is a different action entirely.
   */
  action?: ReactNode;
}

export const ScaleAtomInput = ({ autoFocusValue = true, action }: ScaleAtomInputProps) => {
  const value = useEventDraftStore((s) => s.pendingScale.value);
  const label = useEventDraftStore((s) => s.pendingScale.label);
  const setPendingScale = useEventDraftStore((s) => s.setPendingScale);
  const numberRef = useRef<HTMLInputElement>(null);

  // Autofocus WITHOUT scrolling — a focus-driven scroll mid-modal-transition
  // jumps the whole sheet. preventScroll keeps the caret put. Gated by
  // `autoFocusValue` so the inline panel can open keyboard-down.
  useEffect(() => {
    if (!autoFocusValue) return;
    numberRef.current?.focus({ preventScroll: true });
  }, [autoFocusValue]);

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

        {/* Row 2 — preset choices (single-select). A tap replaces the field. */}
        <ChoiceGroup
          className={styles.scaleChipsRow}
          aria-label="Явление"
          value={label.trim()}
          onChange={(v) => setPendingScale({ label: v })}
        >
          {PRESET_LABELS.map((item) => (
            <ChoiceItem
              key={item}
              value={item}
              // Prevent the tap from blurring the focused input — keeps the
              // keyboard up (no viewport reshuffle) so the choice activates
              // instantly instead of after the keyboard-dismiss animation.
              onMouseDown={(e) => e.preventDefault()}
            >
              {item}
            </ChoiceItem>
          ))}
        </ChoiceGroup>

        {action && <div className={styles.scaleAction}>{action}</div>}
      </div>
    </div>
  );
};

ScaleAtomInput.displayName = 'ScaleAtomInput';
