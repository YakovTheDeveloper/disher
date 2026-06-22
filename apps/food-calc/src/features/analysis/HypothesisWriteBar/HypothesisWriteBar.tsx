import { useCallback, useRef, useState } from 'react';
import { WriteBarShell, WriteBarClip, PlusIcon } from '@/shared/ui/WriteBarShell';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { useOverlayHistory } from '@/shared/lib/useOverlayHistory';
import { safeMutate } from '@/shared/lib/safeMutate';
import { saveHypothesis } from '@/entities/hypothesis';

const TITLE_INPUT_ID = 'hypothesis-title-bar';

// Focus-hint shown above the bar (same affordance Food/Events use): a concrete
// example of the format. The first word is serif-accented by WriteBarShell.
const HYPOTHESIS_HINT = 'Головная боль после молочки';

const BODY_MAX = 500;

type Props = {
  /** Called with the new hypothesis id after a successful save — the slide
   *  paints the ephemeral «new» ring on that row. */
  onCreated: (id: string) => void;
  /** Portal target for the «Подробности» overlay — a node inside the host modal
   *  popup so it joins that popup's stacking context (see ModalByLabel.container).
   *  When omitted, the overlay falls back to `#modal-by-label-root`. */
  overlayContainer?: HTMLElement | null;
  /**
   * Show the focus-hint example above the bar. Default `true` (HomePage/Analyses,
   * where the bar floats over a dark focus-scrim that makes the white hint read).
   * The «Гипотезы» modal passes `false` — there's no scrim there, so the white
   * hint would vanish on the light surface; the «Ваша гипотеза?» placeholder
   * carries the invitation instead.
   */
  showHint?: boolean;
};

/**
 * Bottom write-bar for the Hypotheses screen — the canon Food/Events idiom on
 * the shared WriteBarShell (palette flips with the family via the 'WriteBar'
 * design-variant). Mirrors EventsWriteBar:
 *  - plus glyph (left) → fullscreen «Подробности» modal for the optional `body`
 *    (presence shown as a dot on the clip);
 *  - field (center)    → the hypothesis `title`;
 *  - SEND              → saveHypothesis({title, body}), then clears + collapses.
 *
 * Creation is a local Dexie write (offline-ok), so `online` is always true — the
 * send arrow never shows «Нет сети». Enabled requires a non-empty title; body
 * alone does not create a hypothesis.
 */
const HypothesisWriteBar = ({ onCreated, overlayContainer, showHint = true }: Props) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const submittingRef = useRef(false);

  const hasTitle = title.trim().length > 0;

  // Title-first invariant: a body cannot exist without a title. Clearing the
  // title to empty drops any attached body, so an abandoned «Подробности» can
  // never ride along into the NEXT hypothesis (and the clip below is disabled
  // until there is a title, so you can't write a body on nothing either).
  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    if (!value.trim()) setBody('');
  }, []);

  // Lock the slide pager while the details modal is open; route hardware/browser
  // Back to closing it instead of swiping/navigating away.
  useSwipeableLock(detailsOpen);
  useOverlayHistory(detailsOpen, () => setDetailsOpen(false));

  const handleSubmit = useCallback(
    async (value: string): Promise<boolean> => {
      if (submittingRef.current) return false;
      // singleLine AutoGrowSearch doesn't strip pasted newlines — collapse them.
      const cleanTitle = value.replace(/\s+/g, ' ').trim();
      if (!cleanTitle) return false;
      submittingRef.current = true;
      const result = await safeMutate(
        () => saveHypothesis({ title: cleanTitle, body: body.trim() }),
        'Не удалось сохранить',
      );
      submittingRef.current = false;
      // Clear ONLY on success — a failed write keeps the typed text + body, and
      // returning false keeps the bar focused (WriteBarShell.blurOnSubmit) so the
      // user can retry without re-tapping.
      if (!result.ok) return false;
      onCreated(result.value);
      setTitle('');
      setBody('');
      return true;
    },
    [body, onCreated],
  );

  return (
    <>
      <WriteBarShell
        value={title}
        onChange={handleTitleChange}
        onSubmit={handleSubmit}
        inputId={TITLE_INPUT_ID}
        placeholder="Ваша гипотеза?"
        hint={showHint ? HYPOTHESIS_HINT : undefined}
        // Local Dexie write — never gated on network.
        online
        // After send: drop focus so the scrim drops, bar collapses, keyboard hides.
        blurOnSubmit
        // Send shows on focus; enabled with a non-empty title (body alone ≠ hypothesis).
        computeSend={({ focused, hasText }) => ({ visible: focused, enabled: hasText })}
        sendAriaLabel="Добавить гипотезу"
        leftSlot={
          <WriteBarClip
            onClick={() => setDetailsOpen(true)}
            ariaLabel="Добавить подробности"
            dot={body.trim().length > 0}
            icon={<PlusIcon />}
            disabled={!hasTitle}
          />
        }
      />

      {/* «Подробности» — полноэкранная модалка с многострочным полем body (тот же
          shell, что клип Событий открывает для оценки). body — локальный стейт
          бара; «Готово» / стрелка-назад / системный Back просто закрывают. */}
      <ModalByLabel
        position="fixed"
        container={overlayContainer}
        isExpanded={detailsOpen}
        content={
          <ModalShell variant="spring4">
            <ModalShell.Header
              title="Подробности"
              onBack={() => setDetailsOpen(false)}
              backLabel="Закрыть"
            />
            <ModalShell.Body>
              <AutoGrowSearch
                value={body}
                onChange={setBody}
                placeholder="Что именно проверяем? (необязательно)"
                maxRows={8}
                maxLength={BODY_MAX}
                collapseOnBlur={false}
              />
              <ModalShell.Spacer />
              <ModalShell.ActionButtons
                debugId="hypothesis-details"
                right={
                  <ModalNextButton
                    onClick={() => setDetailsOpen(false)}
                    variant="finish"
                    label="Готово"
                  />
                }
              />
            </ModalShell.Body>
          </ModalShell>
        }
      />
    </>
  );
};

export default HypothesisWriteBar;
