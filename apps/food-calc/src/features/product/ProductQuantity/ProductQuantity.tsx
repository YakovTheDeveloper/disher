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

type Portion = { grams: number; amount: number; unit: string };

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

  // Get portions from food if available
  const portions = content.food?.portions || content.dish?.portions || [];

  // Build quick buttons data
  const quickButtons: QuickButtonData[] =
    portions.length > 0
      ? portions.map((portion) => ({
          quantity: portion.grams,
          label: `${portion.amount} ${portion.unit} (${portion.grams}г)`,
        }))
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

  const handleVariantClick = (quantity: number) => {
    setValue(quantity);
    content.updateQuantity(quantity);
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
          bottom={<span className={style.unit}>граммы</span>}
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
                    {slideButtons.map((button) => (
                      <QuickButton
                        key={button.quantity}
                        className={style.quickBtn}
                        isActive={button.quantity === value}
                        onClick={() => handleVariantClick(button.quantity)}
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
                        onClick={() => handleVariantClick(button.quantity)}
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
