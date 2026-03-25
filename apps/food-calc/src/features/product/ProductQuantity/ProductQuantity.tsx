import { useRef, useState, useMemo } from 'react';
import style from './ProductQuantity.module.scss';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import clsx from 'clsx';

type QuickButtonProps = {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  className?: string;
};

const QuickButton = ({ children, isActive, onClick, className }: QuickButtonProps) => (
  <button type="button" onClick={onClick} className={clsx(className, isActive && 'is-selected')}>
    {children}
  </button>
);

export type Portion = { label: string; grams: number; amount: number; unit: string };

type ProductQuantityContent = {
  quantity: number;
  updateQuantity: (q: number) => void;
  food?: { portions?: Portion[] } | null;
  dish?: { portions?: Portion[] } | null;
};

const variants = [
  [25, 50, 75, 100],
  [150, 200, 300, 400],
  [500, 1000, 2000, 3000],
];

type QuickButtonData = {
  quantity: number;
  label: string;
};

type Props = {
  content: ProductQuantityContent;
  onFinish: () => void;
  inputId?: string;
};

const SLIDE_SIZE = 8; // 2 rows x 4 columns

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const ProductQuantity = ({ onFinish, content, inputId = 'quantity-input' }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [value, setValue] = useState(content.quantity);
  const [activePortion, setActivePortion] = useState<Portion | null>(null);

  // Get portions from food if available
  const portions = content.food?.portions || content.dish?.portions || [];

  // Compute portion count for active portion
  const portionCount = activePortion ? Math.round(value / activePortion.grams) : 0;

  // Build quick buttons data with dynamic labels for active portion
  const quickButtons: QuickButtonData[] =
    portions.length > 0
      ? portions.map((portion) => {
          const isActive = activePortion?.grams === portion.grams && activePortion?.label === portion.label;
          const count = isActive ? portionCount : 1;
          const totalGrams = isActive ? value : portion.grams;
          const label = count > 1
            ? `${count} × ${portion.label} (${totalGrams}г)`
            : `${portion.label} (${portion.grams}г)`;
          return { quantity: totalGrams, label };
        })
      : [];

  const quickButtons2: QuickButtonData[] = variants.flat().map((quantity) => ({
    quantity,
    label: quantity.toString(),
  }));

  const portionSlides = useMemo(() => chunkArray(quickButtons, SLIDE_SIZE), [quickButtons]);
  const quantitySlides = useMemo(() => chunkArray(quickButtons2, SLIDE_SIZE), [quickButtons2]);

  const onBlur = () => {
    content.updateQuantity(value);
    onFinish();
  };

  const handlePortionClick = (portion: Portion) => {
    const isSamePortion = activePortion?.grams === portion.grams && activePortion?.label === portion.label;
    const newValue = isSamePortion ? value + portion.grams : portion.grams;
    setValue(newValue);
    content.updateQuantity(newValue);
    setActivePortion(portion);
  };

  const handleQuantityClick = (quantity: number) => {
    setValue(quantity);
    content.updateQuantity(quantity);
    setActivePortion(null);
  };

  return (
    <div className={style.container}>
      {/* Editorial hero input */}
      <div className={style.inputWrapper}>
        <NumberInput
          id={inputId}
          placeholder="Количество"
          ref={inputRef}
          className={style.input}
          onChange={setValue}
          value={value}
          onBlur={onBlur}
          bottom={<span className={style.unit}>{activePortion && portionCount > 0 ? `${portionCount} × ${activePortion.label}` : 'граммы'}</span>}
        />
      </div>

      {/* Portions carousel */}
      {portionSlides.length > 0 && (
        <div className={style.section}>
          <span className={style.sectionLabel}>Порции</span>
          <div className={style.snapViewport}>
            <div className={style.snapContainer}>
              {portionSlides.map((slideButtons, slideIndex) => (
                <div key={slideIndex} className={style.snapSlide}>
                  <div className={style.slideGrid}>
                    {slideButtons.map((button, i) => (
                      <QuickButton
                        key={button.label}
                        className={style.quickBtn}
                        isActive={activePortion?.grams === portions[slideIndex * SLIDE_SIZE + i]?.grams && activePortion?.label === portions[slideIndex * SLIDE_SIZE + i]?.label}
                        onClick={() => handlePortionClick(portions[slideIndex * SLIDE_SIZE + i])}
                      >
                        {button.label}
                      </QuickButton>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Default quantities carousel */}
      {quantitySlides.length > 0 && (
        <div className={style.section}>
          <span className={style.sectionLabel}>Количество</span>
          <div className={style.snapViewport}>
            <div className={style.snapContainer}>
              {quantitySlides.map((slideButtons, slideIndex) => (
                <div key={slideIndex} className={style.snapSlide}>
                  <div className={style.slideGrid}>
                    {slideButtons.map((button) => (
                      <QuickButton
                        key={button.quantity}
                        className={style.quickBtn}
                        isActive={button.quantity === value}
                        onClick={() => handleQuantityClick(button.quantity)}
                      >
                        {button.label}
                      </QuickButton>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductQuantity;
