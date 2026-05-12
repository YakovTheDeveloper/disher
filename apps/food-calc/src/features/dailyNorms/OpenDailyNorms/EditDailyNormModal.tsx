import { useCallback, useEffect, useMemo, useRef } from 'react';
import { modalStore, type BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalConfirmation } from '@/shared/ui/Modal/ModalConfirmation';
import {
  useDailyNormDraftStore,
  useUserNormItems,
  patchUserNormItems,
  DEFAULT_NORM_ITEMS,
  USER_NORM_NAME,
  type DailyNormItems,
} from '@/entities/daily-norm';
import { defaultDailyNorms } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';
import NutrientDesignVariants from '@/widgets/nutrients/FoodsNutrients/NutrientDesignVariants';
import CreateDailyNormModal from './CreateDailyNormModal';
import styles from './EditDailyNormModal.module.scss';

type Props = BaseModalProps;

function buildMerged(items: DailyNormItems | null): DailyNormItems {
  const base = items ?? DEFAULT_NORM_ITEMS;
  const merged: DailyNormItems = {};
  for (const [id, val] of Object.entries(defaultDailyNorms)) {
    merged[String(id)] = base[String(id)] ?? val;
  }
  // Preserve any nutrient id present in the user norm but missing from
  // defaultDailyNorms (e.g. amino acids not listed there).
  for (const [id, val] of Object.entries(base)) {
    if (!(id in merged)) merged[id] = val;
  }
  return merged;
}

function isDirty(initial: DailyNormItems, current: DailyNormItems): boolean {
  const keys = new Set([...Object.keys(initial), ...Object.keys(current)]);
  for (const k of keys) {
    if ((initial[k] ?? 0) !== (current[k] ?? 0)) return true;
  }
  return false;
}

const EditDailyNormModal = ({ onClose }: Props) => {
  const userItems = useUserNormItems();
  const { items, init, setNutrient, clear } = useDailyNormDraftStore();
  const initialItemsRef = useRef<DailyNormItems>({});
  const bodyRef = useRef<HTMLDivElement>(null);
  const initialisedRef = useRef(false);

  useEffect(() => {
    if (initialisedRef.current) return;
    const merged = buildMerged(userItems);
    initialItemsRef.current = merged;
    init(merged);
    initialisedRef.current = true;
    return () => clear();
  }, [userItems, init, clear]);

  const getDraftValue = useCallback(
    (nutrientId: string) => items[nutrientId] ?? 0,
    [items],
  );

  const handleValueChange = useCallback(
    (nutrientId: string, value: number) => {
      setNutrient(nutrientId, value);
    },
    [setNutrient],
  );

  const dirty = useMemo(
    () => isDirty(initialItemsRef.current, items),
    [items],
  );

  const handleSave = useCallback(async () => {
    const result = await safeMutate(
      () => patchUserNormItems(items),
      'Не удалось сохранить норму',
    );
    if (!result.ok) return;
    toaster.success('Норма сохранена');
    onClose();
  }, [items, onClose]);

  const handleRequestClose = useCallback(() => {
    if (!dirty) {
      onClose();
      return;
    }
    modalStore.show(ModalConfirmation, {
      data: { action: 'закрыть без сохранения? Изменения будут потеряны.' },
      onConfirm: () => {
        modalStore.closeLast();
        onClose();
      },
    });
  }, [dirty, onClose]);

  const handleRecalc = useCallback(() => {
    const proceed = () => {
      onClose();
      void modalStore.show(CreateDailyNormModal, {});
    };
    if (!dirty) {
      proceed();
      return;
    }
    modalStore.show(ModalConfirmation, {
      data: { action: 'пересчитать норму? Текущие изменения будут потеряны.' },
      onConfirm: () => {
        modalStore.closeLast();
        proceed();
      },
    });
  }, [dirty, onClose]);

  const handleFocusCapture = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const tag = target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
    window.setTimeout(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
  }, []);

  return (
    <ModalLayout>
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <span className={styles.kicker}>Дневная норма</span>
            <span className={styles.title}>{USER_NORM_NAME}</span>
          </div>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!dirty}
            type="button"
          >
            Сохранить
          </button>
        </div>
        <div
          ref={bodyRef}
          className={styles.body}
          onFocusCapture={handleFocusCapture}
        >
          <NutrientDesignVariants
            variant="edit-norms"
            getValue={getDraftValue}
            onValueChange={handleValueChange}
          />
        </div>
        <div className={styles.footer}>
          <button
            className={styles.recalcBtn}
            onClick={handleRecalc}
            type="button"
          >
            Пересчитать по анкете
          </button>
          <button
            className={styles.closeBtn}
            onClick={handleRequestClose}
            type="button"
          >
            Закрыть
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

export default EditDailyNormModal;
