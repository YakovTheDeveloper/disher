import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import style from './Quantity.module.scss';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import { QuickButton } from '@/components/features/builders/food/shared/atoms/QuickButtons/QuickButton';

const variants = [
  [25, 50, 75, 100],
  [150, 200, 300, 400],
  [500, 1000, 2000, 3000],
];

type Props = {
  item: {
    quantity: number;
    updateQuantity: (quantity: number) => void;
  };
  onFinish: () => void;
};

const Quantity = ({ onFinish, item }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [value, setValue] = useState(item.quantity);

  const onBlur = () => {
    item.updateQuantity(value);
    // onFinish()
  };

  const handleVariantClick = (quantity: number) => {
    setValue(quantity);
    item.updateQuantity(quantity);
    // onFinish();
  };

  // useEffect(() => {
  //   inputRef.current?.focus();
  // }, []);

  return (
    <>
      <div className={style.variants}>
        {variants.map((values, index) =>
          values.map((value) => (
            <QuickButton key={index} onClick={() => handleVariantClick(value)}>
              {value}
            </QuickButton>
          ))
        )}
      </div>
      <div className={style.header}>
        <div className={style.inputWrapper}>
          <NumberInput
            // autoFocus
            size="big"
            boxShadow
            placeholder="Введите количество"
            ref={inputRef}
            className={style.input}
            onChange={setValue}
            value={value}
            onBlur={onBlur}
          />
          <span className={style.unit}>г.</span>
        </div>
      </div>
    </>
  );
};

export default observer(Quantity);
