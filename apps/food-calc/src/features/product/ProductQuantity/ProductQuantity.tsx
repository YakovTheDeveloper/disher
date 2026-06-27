import { useRef, useState } from 'react';
import style from './ProductQuantity.module.scss';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { ChoiceGroup, ChoiceItem } from '@/shared/ui/atoms/Choice';
import { Numeral } from '@/shared/ui/atoms/Typography';

export type Portion = { label: string; grams: number };

// Index-suffixed so two portions with identical label+grams don't collide into
// one Choice value (which would render both as checked + dup the React key).
const portionKey = (p: Portion, i: number) => `${p.label}-${p.grams}-${i}`;

// Derived multiplier readout: how many portions `value` grams represent. The
// multiplier is NEVER stored — `value` (grams) is the single source of truth, so
// a manual grams edit and a stepper tap can't disagree (the old design kept a
// separate `multiplier` state that desynced when grams were typed directly).
const formatMultiplier = (value: number, grams: number) => {
  if (grams <= 0) return '';
  const mult = Math.round((value / grams) * 10) / 10;
  return `×${Number.isInteger(mult) ? mult : mult.toFixed(1)}`;
};

// Snap an arbitrary multiplier to the nearest half-step, so +/− always land back
// on a clean grid (×0.5, ×1, ×1.5…) even after a custom grams edit nudged it off.
const snapHalf = (n: number) => Math.round(n * 2) / 2;

type ProductQuantityContent = {
  quantity: number;
  updateQuantity: (q: number) => void;
  product?: { portions?: Portion[] } | null;
  dish?: { portions?: Portion[] } | null;
};

type Props = {
  content: ProductQuantityContent;
  onFinish: () => void;
  inputId?: string;
  isActive?: boolean;
};

// Outer component: ALWAYS renders the hero <NumberInput id={inputId}> in the same
// DOM node so <label htmlFor={inputId}> focus delegation keeps working on iOS even
// when this step is not active. Heavy work (portion chips) lives in
// <ProductQuantityHeavy>, conditionally mounted via {isActive && ...}.
// See feedback_ios_focus.md for why the input must stay in the same DOM node.
const ProductQuantity = ({
  onFinish,
  content,
  inputId = 'quantity-input',
  isActive = true,
}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(content.quantity);
  const [activePortion, setActivePortion] = useState<Portion | null>(null);

  const onBlur = () => {
    content.updateQuantity(value);
    onFinish();
  };

  const commit = (newValue: number) => {
    setValue(newValue);
    content.updateQuantity(newValue);
  };

  const handlePortionClick = (portion: Portion) => {
    const isSame = activePortion?.grams === portion.grams && activePortion?.label === portion.label;
    if (isSame) {
      setActivePortion(null);
      return;
    }
    setActivePortion(portion);
    commit(portion.grams); // ×1
  };

  // +/− step the GRAMS by a half-portion, snapped to clean half-multiples so a
  // prior manual edit lands back on the grid. Floor at ×0.5 (no zero/negative).
  const handleStep = (deltaHalfSteps: number) => {
    if (!activePortion) return;
    const current = value / activePortion.grams;
    const nextMult = Math.max(0.5, snapHalf(current) + deltaHalfSteps * 0.5);
    commit(Math.round(activePortion.grams * nextMult));
  };

  const stepperShown = isActive && activePortion !== null;
  const multiplierLabel = activePortion ? formatMultiplier(value, activePortion.grams) : '';

  return (
    <div className={style.container}>
      {/* Static `1fr auto 1fr`: the number sits dead-centre in the `auto` track,
          flanked by equal fr tracks — so it stays centred whether or not the
          stepper is mounted (the right flank absorbs the stepper without resizing
          the centre track). NO track transition: the old design animated to
          `0fr auto 1fr` to shove the number left, which is a per-frame LAYOUT
          animation (forbidden by the composite-only budget) AND moved the very
          number the user is reading. Now the number never moves; only the stepper
          animates, on the compositor (translateX + opacity keyframe). */}
      <div className={style.quantityRow}>
        <div className={style.inputWrapper}>
          <div className={style.inputRow}>
            {/* Auto-grow input: a span mirrors the digits with the same font,
                so its width = the real rendered width of the number. The
                <input> is absolutely placed on top of the span, so the
                wrapper's flex layout sees the SPAN's width — and the .unit
                sibling sits flush against the last digit, not a fixed ch box. */}
            <span className={style.inputBox}>
              <span aria-hidden className={style.mirror}>
                {value || 0}
              </span>
              <NumberInput
                id={inputId}
                placeholder="Количество"
                ref={inputRef}
                className={style.input}
                onChange={setValue}
                value={value}
                onBlur={onBlur}
                maxLength={5}
              />
            </span>
            <Numeral as="span" size="md" weight="medium" className={style.unit}>{'г'}</Numeral>
          </div>
        </div>

        {/* Segmented stepper in the right grid column. Mounted only while a
            portion is active; the entrance is a composite keyframe (the number
            never moves). */}
        {stepperShown && (
          <div className={style.multiplierRow}>
            <QuantityStepper label={multiplierLabel} onStep={handleStep} />
          </div>
        )}
      </div>

      {isActive && (
        <ProductQuantityHeavy
          content={content}
          activePortion={activePortion}
          onPortionClick={handlePortionClick}
        />
      )}
    </div>
  );
};

type StepperProps = {
  label: string;
  onStep: (deltaHalfSteps: number) => void;
};

// Segmented stepper: one warm pill (echoing the number's field material) with
// +/×N/− as flush segments split by the canon's fading hairline. The ×N readout
// is DERIVED from grams, read-only — never a second editable field.
const QuantityStepper = ({ label, onStep }: StepperProps) => {
  return (
    <div className={style.stepper} role="group" aria-label="Кратность порции">
      <button
        type="button"
        className={style.multiplierBtn}
        aria-label="Увеличить количество"
        onClick={() => onStep(+1)}
      >
        <Numeral as="span" size="lg" weight="semibold">+</Numeral>
      </button>
      <Numeral as="span" size="md" weight="semibold" className={style.multiplierValue}>
        {label}
      </Numeral>
      <button
        type="button"
        className={style.multiplierBtn}
        aria-label="Уменьшить количество"
        onClick={() => onStep(-1)}
      >
        <Numeral as="span" size="lg" weight="semibold">−</Numeral>
      </button>
    </div>
  );
};

type HeavyProps = {
  content: ProductQuantityContent;
  activePortion: Portion | null;
  onPortionClick: (portion: Portion) => void;
};

// Portion chips only — the stepper lives in the outer component (it shares the
// number's row, in the right grid column).
const ProductQuantityHeavy = ({ content, activePortion, onPortionClick }: HeavyProps) => {
  const portions = content.product?.portions || content.dish?.portions || [];

  if (portions.length === 0) return null;

  // Single-select among portions → role=radiogroup. Toggle-off (re-tapping the
  // active portion clears it) stays in `handlePortionClick`: Choice always fires
  // onChange on click, so the consumer owns the deselect — no Choice-level flag.
  const selectedIdx = activePortion ? portions.findIndex((p) => p === activePortion) : -1;
  const selectedKey = selectedIdx >= 0 ? portionKey(portions[selectedIdx], selectedIdx) : null;
  const handleChange = (key: string) => {
    const portion = portions.find((p, i) => portionKey(p, i) === key);
    if (portion) onPortionClick(portion);
  };

  return (
    <div className={style.section}>
      {/* Plain wrapping row — the portion set is small, so showing every chip
          at once beats a horizontal scroll (no hidden affordance, no JS). */}
      <ChoiceGroup
        className={style.portionChips}
        aria-label="Порция"
        value={selectedKey}
        onChange={handleChange}
      >
        {portions.map((portion, i) => (
          <ChoiceItem key={portionKey(portion, i)} value={portionKey(portion, i)} className={style.portionChip}>
            {portion.label} ({portion.grams}г)
          </ChoiceItem>
        ))}
      </ChoiceGroup>
    </div>
  );
};

export default ProductQuantity;
