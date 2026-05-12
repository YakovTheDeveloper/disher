import { useClipboardStore } from '@/shared/model/clipboardStore';
import { addDishItem } from '@/entities/dish';
import Button from '@/shared/ui/atoms/Button/Button';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import s from './PasteFromClipboardButton.module.scss';
import clsx from 'clsx';

type Props = {
  dishId: string;
  btnClassName?: string;
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
};

const MAX_PREVIEW = 5;

export const PasteFromClipboardToDishButton = ({ dishId, btnClassName, wrapperClassName, wrapperStyle }: Props) => {
  const items = useClipboardStore((s) => s.items);
  const clearClipboard = useClipboardStore((s) => s.clearClipboard);

  const foodItems = items.filter((item) => item.type === 'food' && item.productId);
  if (foodItems.length === 0) return null;

  const handlePaste = async () => {
    const result = await safeMutate(async () => {
      for (const item of foodItems) {
        await addDishItem({
          dishId,
          productId: item.productId!,
          quantity: item.quantity,
        });
      }
    }, 'Не удалось вставить');
    if (!result.ok) return;
    clearClipboard();
    toaster.success(`Вставлено: ${foodItems.length}`);
  };

  const preview = foodItems.slice(0, MAX_PREVIEW);

  return (
    <div className={clsx(s.wrapper, wrapperClassName)} style={wrapperStyle}>
      <div className={s.header}>
        <span className={s.title}>скопировано:</span>
        <button type="button" className={s.clearBtn} onClick={clearClipboard}>
          ✕
        </button>
      </div>

      <div className={s.items}>
        {preview.map((item, i) => (
          <div
            key={`${item.displayName}-${item.time}-${i}`}
            className={clsx(s.item, s[`item_${i}` as keyof typeof s])}
          >
            <span className={s.itemName}>{item.displayName}</span>
          </div>
        ))}
      </div>

      <div className={s.actions}>
        <Button variant="ghost" onClick={handlePaste} className={clsx(s.pasteBtn, btnClassName)}>
          Вставить в блюдо ({foodItems.length})
        </Button>
      </div>
    </div>
  );
};
