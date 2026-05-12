import { useClipboardStore } from '@/shared/model/clipboardStore';
import { pasteClipboardItems } from '@/entities/schedule-food';
import Button from '@/shared/ui/atoms/Button/Button';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import s from './PasteFromClipboardButton.module.scss';
import clsx from 'clsx';

type Props = {
  targetDate: string;
  btnClassName?: string;
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
};

const MAX_PREVIEW = 5;

export const PasteFromClipboardButton = ({ targetDate, btnClassName, wrapperClassName, wrapperStyle }: Props) => {
  const items = useClipboardStore((s) => s.items);
  const clearClipboard = useClipboardStore((s) => s.clearClipboard);

  if (items.length === 0) return null;

  const handlePaste = async () => {
    const result = await safeMutate(() => pasteClipboardItems(items, targetDate), 'Не удалось вставить');
    if (!result.ok) return;
    clearClipboard();
    toaster.success(`Вставлено: ${items.length}`);
  };

  const preview = items.slice(0, MAX_PREVIEW);

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
            <span className={s.itemTime}>{item.time}</span>
          </div>
        ))}
      </div>

      <div className={s.actions}>
        <Button variant="ghost" onClick={handlePaste} className={clsx(s.pasteBtn, btnClassName)}>
          Вставить ({items.length})
        </Button>
      </div>
    </div>
  );
};
