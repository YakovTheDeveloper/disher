import { useCallback, useRef, useState } from 'react';
import { WriteBarShell } from '@/shared/ui/WriteBarShell';
import { safeMutate } from '@/shared/lib/safeMutate';
import { saveHypothesis } from '@/entities/hypothesis';

const TITLE_INPUT_ID = 'hypothesis-title-bar';

// Подсказка бара за ⓘ в доке над баром (бумажка-поповер, 2026-07-17). Что такое
// гипотеза + где дописать описание (правка по клику, не левый плюс — он снят
// 2026-07-17 как пережиток). Выделение — <strong> (вес): Onest без курсива.
const HYPOTHESIS_HINT = (
  <>
    <p>
      Гипотеза — короткая догадка, что на что влияет: например,{' '}
      <strong>«головная боль после молочки»</strong>. Одна мысль в строку.
    </p>
    <p>
      Описание можно добавить позже — <strong>тапните гипотезу</strong> в списке.
    </p>
  </>
);

type Props = {
  /** Called with the new hypothesis id after a successful save — the slide
   *  paints the ephemeral «new» ring on that row. */
  onCreated: (id: string) => void;
  /**
   * Show the ⓘ hint above the bar (paper popover). Default `true`. A host that
   * wants a bare bar (no hint affordance) opts out with `false`.
   */
  showHint?: boolean;
};

/**
 * Bottom write-bar for the Hypotheses screen — the canon Food/Events idiom on the
 * shared WriteBarShell. Title-only creation: the field takes the hypothesis
 * `title`, SEND writes it via `saveHypothesis`, then clears + collapses. The
 * optional `body` («Подробности») is NOT entered here — it's added later by tapping
 * an existing row (`EditHypothesisModal`); the left «plus» affordance that used to
 * open a body draft was removed 2026-07-17 as a remnant.
 *
 * Creation is a local Dexie write (offline-ok), so `online` is always true — the
 * send arrow never shows «Нет сети». Enabled requires a non-empty title.
 */
const HypothesisWriteBar = ({ onCreated, showHint = true }: Props) => {
  const [title, setTitle] = useState('');
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(
    async (value: string): Promise<boolean> => {
      if (submittingRef.current) return false;
      // singleLine AutoGrowSearch doesn't strip pasted newlines — collapse them.
      const cleanTitle = value.replace(/\s+/g, ' ').trim();
      if (!cleanTitle) return false;
      submittingRef.current = true;
      const result = await safeMutate(
        // body starts empty — filled later via EditHypothesisModal on row-tap.
        () => saveHypothesis({ title: cleanTitle, body: '' }),
        'Не удалось сохранить',
      );
      submittingRef.current = false;
      // Clear ONLY on success — a failed write keeps the typed text, and returning
      // false keeps the bar focused (WriteBarShell.blurOnSubmit) for a retry.
      if (!result.ok) return false;
      onCreated(result.value);
      setTitle('');
      return true;
    },
    [onCreated],
  );

  return (
    <WriteBarShell
      value={title}
      onChange={setTitle}
      onSubmit={handleSubmit}
      inputId={TITLE_INPUT_ID}
      placeholder="Ваша гипотеза?"
      hintPopover={showHint ? HYPOTHESIS_HINT : undefined}
      // Local Dexie write — never gated on network.
      online
      // After send: drop focus so the scrim drops, bar collapses, keyboard hides.
      blurOnSubmit
      // Send appears with a non-empty title and vanishes on an empty field
      // (content-driven canon 2026-07-02).
      computeSend={({ hasText }) => ({ visible: hasText, enabled: hasText })}
      sendAriaLabel="Добавить гипотезу"
    />
  );
};

export default HypothesisWriteBar;
