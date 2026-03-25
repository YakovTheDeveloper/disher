import type { ClipboardItem } from '@/shared/model/clipboardStore';
import { useClipboardStore } from '@/shared/model/clipboardStore';
import { IconButton } from '@/shared/ui/atoms/Button/IconButton';
import { CountBadge } from '@/shared/ui/atoms/Button/CountBadge/CountBadge';
import toaster from '@/shared/lib/toaster/toaster';

type Props = {
  items: ClipboardItem[];
  sourceDate: string;
  selectedCount: number;
  onCopied?: () => void;
};

export const CopyToClipboardButton = ({ items, sourceDate, selectedCount, onCopied }: Props) => {
  const copyToClipboard = useClipboardStore((s) => s.copyToClipboard);

  const handleClick = () => {
    if (items.length === 0) return;
    copyToClipboard(items, sourceDate);
    toaster.success(`Скопировано в буфер: ${items.length}`);
    onCopied?.();
  };

  return (
    <IconButton
      icon={<ClipboardIcon />}
      badge={selectedCount > 0 ? <CountBadge size="sm" count={selectedCount} /> : undefined}
      onClick={handleClick}
    >
      В буфер
    </IconButton>
  );
};

const ClipboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
