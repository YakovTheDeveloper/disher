import { ScheduleBuilderViewModel } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import style from './Quantity.module.scss';
import commonStyle from '../ContentEdit.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { useItemIdParam } from '@/hooks/useItemIdParams';

const variants = [
  [25, 50, 75],
  [100, 150, 200],
  [300, 400, 500],
  [1000, 2000, 3000],
].flatMap((val) => val);

type Props = {
  store: {
    updateQuantity: (id: string, quantity: number) => void;
    getChildById: (id: string) => { quantity: number };
  };
  onFinish: () => void;
};

const Wrapper = ({ store, onFinish }: Props) => {
  const itemId = useItemIdParam();
  if (!itemId) return null;
  return <Quantity store={store} onFinish={onFinish} itemId={itemId} />;
};

const Quantity = ({ store, onFinish, itemId }: Props & { itemId: string }) => {
  const current = store.getChildById(itemId);
  const initQuantity = current?.quantity;

  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const customInputRef = useRef<HTMLInputElement | null>(null);

  const showCustomInput = () => setIsCustom(true);
  const hideCustomInput = () => setIsCustom(false);
  const onCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomValue(e.target.value);
  };

  const onAccept = (quantity: number) => {
    store.updateQuantity(itemId, quantity);
    onFinish();
  };

  const onCustomAccept = () => {
    store.updateQuantity(itemId, Number(customValue));
    onFinish();
  };

  useEffect(() => {
    if (!isCustom) return;
    customInputRef.current?.focus();
  }, [isCustom]);

  const onCustomButtonClick = () => {
    if (isCustom) {
      const quantity = Number(customValue);
      onAccept(quantity);
      return;
    }
    showCustomInput();
  };

  const customInputStyle = {
    width: `${customValue.length + 1}ch`,
  };

  const customQuantitytUnitStyle = {
    paddingLeft: `${customValue.length + 1}зч`,
  };

  const customBackgroundStyle = {
    transform: `translate(-50%, -50%) rotate(${90 * customValue.length}deg)`,
  };

  console.log(initQuantity);

  return (
    <div className={clsx([style.container, commonStyle.SuggestionWrapper])}>
      <div className={clsx([style.items])}>
        {variants.map((quantity) => (
          <button
            onClick={() => onAccept(quantity)}
            key={quantity}
            className={clsx([
              style.item,
              !isCustom && initQuantity === quantity && style.item_active,
            ])}
          >
            {quantity} г.
          </button>
        ))}
        <span></span>
        <button onClick={onCustomButtonClick} className={clsx([style.item, style.item_custom])}>
          {isCustom ? (
            <>
              <input
                style={customInputStyle}
                ref={customInputRef}
                onChange={onCustomChange}
                maxLength={4}
                value={customValue}
              ></input>
              <span style={customBackgroundStyle} className={clsx([style.item_background])}></span>
            </>
          ) : (
            'Кастом'
          )}
        </button>
        {isCustom && <button onClick={onCustomAccept}>OK</button>}
      </div>
    </div>
  );
};

export default observer(Wrapper);
