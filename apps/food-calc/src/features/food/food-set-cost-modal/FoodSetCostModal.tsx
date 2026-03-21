import { useState, useRef, useEffect, FC } from 'react';
import Button from '@/shared/ui/atoms/Button/Button';
import { BaseModalProps } from '@/shared/ui';
import moneyImg from '@/shared/assets/decarative/money.png';
import s from './FoodSetCostModal.module.scss';

export type CostResult = {
  price: number;
  perGrams: number;
};

type Props = BaseModalProps<CostResult> & {
  itemName: string;
  currentPrice: number;
  currentPerGrams: number;
};

const WEIGHT_PRESETS = [100, 500, 1000];

const FoodSetCostModal: FC<Props> = ({ itemName, currentPrice, currentPerGrams, onClose }) => {
  const [price, setPrice] = useState(currentPrice > 0 ? currentPrice.toString() : '');
  const [perGrams, setPerGrams] = useState(currentPerGrams);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice) && numPrice >= 0) {
      onClose({ price: numPrice, perGrams });
    } else {
      onClose(undefined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose(undefined);
  };

  const handleClear = () => {
    onClose({ price: 0, perGrams: 100 });
  };

  return (
    <div className={s.overlay} onClick={() => onClose(undefined)}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <img src={moneyImg} alt="" className={s.decorImg} />
        <span className={s.label}>стоимость</span>
        <span className={s.itemName}>{itemName}</span>

        <div className={s.inputGroup}>
          <input
            ref={inputRef}
            className={s.input}
            type="number"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
          />
          <span className={s.currency}>₽</span>
        </div>

        <div className={s.weightRow}>
          <span className={s.weightLabel}>за</span>
          {WEIGHT_PRESETS.map((w) => (
            <button
              key={w}
              type="button"
              className={`${s.weightBtn} ${perGrams === w ? s.weightBtn_active : ''}`}
              onClick={() => setPerGrams(w)}
            >
              {w >= 1000 ? `${w / 1000} кг` : `${w} г`}
            </button>
          ))}
        </div>

        <div className={s.actions}>
          {currentPrice > 0 && (
            <Button variant="ghost" onClick={handleClear}>
              сбросить
            </Button>
          )}
          <Button variant="ghost" onClick={() => onClose(undefined)}>
            отмена
          </Button>
          <Button variant="ghost" onClick={handleSubmit}>
            сохранить
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FoodSetCostModal;
