import { useClipboardStore } from '@/shared/model/clipboardStore';
import { pasteClipboardItems } from '@/entities/schedule-food';
import Button from '@/shared/ui/atoms/Button/Button';
import toaster from '@/shared/lib/toaster/toaster';

type Props = {
  targetDate: string;
  btnClassName?: string;
  dividerClassName?: string;
};

export const PasteFromClipboardButton = ({ targetDate, btnClassName, dividerClassName }: Props) => {
  const items = useClipboardStore((s) => s.items);
  const clearClipboard = useClipboardStore((s) => s.clearClipboard);

  if (items.length === 0) return null;

  const handlePaste = async () => {
    await pasteClipboardItems(items, targetDate);
    toaster.success(`Вставлено: ${items.length}`);
  };

  return (
    <>
      {dividerClassName && <span className={dividerClassName} />}
      <Button variant="ghost" onClick={handlePaste} className={btnClassName}>
        Вставить ({items.length})
      </Button>
      <button
        type="button"
        onClick={clearClipboard}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-sm)',
          padding: '0 var(--space-1)',
          cursor: 'pointer',
          opacity: 0.6,
        }}
        aria-label="Очистить буфер"
      >
        ✕
      </button>
    </>
  );
};
