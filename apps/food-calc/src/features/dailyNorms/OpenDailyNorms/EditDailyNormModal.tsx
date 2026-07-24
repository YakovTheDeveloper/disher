import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import { type BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { useUserNormItems, USER_NORM_NAME, upsertUserNorm } from '@/entities/daily-norm';
import { NutrientEditView } from '@/entities/nutrient/ui/NutrientEditView';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';
import { useNormMethodStore } from '@/features/dailyNorms/model';
import Button from '@/shared/ui/atoms/Button/Button';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './EditDailyNormModal.module.scss';

// chrome:
//   'modal' (default) — full modal with ModalLayout, title header + fixed footer.
//   'panel' — inline body ONLY (for DailyNormModal, which owns the header) + a
//             terminal flow footer with the «Сохранить» action.
type Props = BaseModalProps & {
  chrome?: 'modal' | 'panel';
};

/**
 * Ручной ввод дневной нормы: редактируемый список нутриентов (`NutrientEditView`,
 * тот же примитив, что правит состав продукта), засеянный текущей нормой. Правки
 * копятся локально; «Сохранить» коммитит их одним `upsertUserNorm`. View-only
 * витрина (`NutrientNormView`) + «Пересчитать по анкете» из этого пути убраны —
 * пересчёт живёт в survey-теле DailyNormModal.
 */
const EditDailyNormModal = ({ onClose, chrome = 'modal' }: Props) => {
  const items = useUserNormItems();
  const setMethod = useNormMethodStore((s) => s.setMethod);

  // Локальный черновик правок. `null` до тех пор, пока норма не разрешилась из IDB
  // (undefined = грузится) — засеиваем ОДИН раз, иначе бы гонка с первой эмиссией
  // useLiveQuery затёрла введённое (см. док useUserNormItems).
  const [edits, setEdits] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (items !== undefined && edits === null) setEdits({ ...(items ?? {}) });
  }, [items, edits]);

  const getValue = useCallback((id: string) => edits?.[id] ?? 0, [edits]);

  const onValueChange = useCallback((id: string, value: number) => {
    setEdits((prev) => {
      const next = { ...(prev ?? {}) };
      if (value > 0) next[id] = value;
      else delete next[id];
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    const result = await safeMutate(
      () => upsertUserNorm(edits ?? {}),
      'Не удалось сохранить норму'
    );
    if (!result.ok) return;
    setMethod('manual');
    toaster.success('Норма сохранена');
    onClose();
  }, [edits, onClose, setMethod]);

  const ready = items !== undefined && edits !== null;
  const isPanel = chrome === 'panel';

  const bodyContent = ready ? (
    <NutrientEditView getValue={getValue} onValueChange={onValueChange} />
  ) : (
    <div className={styles.loadingState} aria-live="polite">
      <Spinner size={20} />
      <Text as="span" role="caption" className={styles.loadingText}>
        Загружаем норму…
      </Text>
    </div>
  );

  const saveButton = (
    <Button variant="system" fullWidth disabled={!ready} onClick={handleSave}>
      Сохранить
    </Button>
  );

  if (isPanel) {
    return (
      <div className={clsx(styles.root, styles.rootPanel)}>
        <div className={clsx(styles.body, styles.bodyPanel)}>{bodyContent}</div>
        <ModalShell.ActionButtons placement="flow" right={saveButton} />
      </div>
    );
  }

  return (
    <ModalLayout a11yLabel={USER_NORM_NAME}>
      <ModalShell>
        <ModalShell.Header title={USER_NORM_NAME} onBack={onClose} />
        <ModalShell.Body>
          {bodyContent}
          <ModalShell.Spacer />
          <ModalShell.ActionButtons debugId="daily-norm-edit" right={saveButton} />
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default EditDailyNormModal;
