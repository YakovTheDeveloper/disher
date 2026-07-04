import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/atoms/Button';
import styles from './AnalysisCard.module.scss';

// Кнопка «Сохранить» карточки разбора (variant='not-added'). Держит added/saving
// состояние + тосты — идентична у инсайта и гипотезы, поэтому вынесена в общий
// атом. Белая плитка-кнопка на холодном wash секции (onSurface={1}): заливка до
// белого surface-2 + hairline-кромка, без тени (класс .add режет высоту до 40px).
type Props = {
  onAdd: () => Promise<void>;
  label?: string;
  addedAriaLabel?: string;
  successToast?: string;
  errorToast?: string;
};

const CardSaveButton = ({
  onAdd,
  label = 'Сохранить',
  addedAriaLabel = 'Сохранено',
  successToast = 'Сохранено',
  errorToast = 'Не удалось сохранить',
}: Props) => {
  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (added || saving) return;
    setSaving(true);
    try {
      await onAdd();
      setAdded(true);
      toast.success(successToast);
    } catch (err) {
      console.error('save analysis card failed', err);
      toast.error(errorToast);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      variant="surface"
      onSurface={1}
      className={styles.add}
      onClick={handleAdd}
      disabled={added || saving}
      aria-label={added ? addedAriaLabel : label}
    >
      {added ? '✓ сохранено' : label}
    </Button>
  );
};

export default CardSaveButton;
