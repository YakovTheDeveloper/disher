import { useCallback, useEffect, useMemo, useRef } from 'react';
import { modalStore, type BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalConfirmation } from '@/shared/ui/Modal/ModalConfirmation';
import {
  useDailyNormDraftStore,
  DEFAULT_NORM_ID,
  DEFAULT_NORM,
  SPORTS_NORM_ID,
  SPORTS_NORM,
  useDailyNorm,
} from '@/entities/daily-norm';
import { updateDailyNorm } from '@/entities/daily-norm';
import { defaultDailyNorms } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { safeMutate } from '@/shared/lib/safeMutate';
import toaster from '@/shared/lib/toaster/toaster';
import NutrientDesignVariants from '@/widgets/nutrients/FoodsNutrients/NutrientDesignVariants';
import styles from './EditDailyNormModal.module.scss';

type Props = BaseModalProps & {
  normId: string;
};

type DbNorm = { name?: string; items: string } | null;

function resolveNormItems(normId: string, dbNorm: DbNorm): Record<string, number> {
  if (normId === DEFAULT_NORM_ID) return { ...DEFAULT_NORM.items };
  if (normId === SPORTS_NORM_ID) return { ...SPORTS_NORM.items };
  if (!dbNorm) return {};
  try { return JSON.parse(dbNorm.items); } catch { return {}; }
}

function resolveNormName(normId: string, dbNorm: DbNorm): string {
  if (normId === DEFAULT_NORM_ID) return DEFAULT_NORM.name;
  if (normId === SPORTS_NORM_ID) return SPORTS_NORM.name;
  return dbNorm?.name ?? 'Норма';
}

function buildMerged(resolved: Record<string, number>): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const [id, val] of Object.entries(defaultDailyNorms)) {
    merged[String(id)] = resolved[String(id)] ?? val;
  }
  return merged;
}

function isDirty(initial: Record<string, number>, current: Record<string, number>): boolean {
  const keys = new Set([...Object.keys(initial), ...Object.keys(current)]);
  for (const k of keys) {
    if ((initial[k] ?? 0) !== (current[k] ?? 0)) return true;
  }
  return false;
}

const EditDailyNormModal = ({ normId, onClose }: Props) => {
  const dbNorm = useDailyNorm(normId);
  const { items, init, setNutrient, clear } = useDailyNormDraftStore();
  const initialItemsRef = useRef<Record<string, number>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  const normName = useMemo(() => resolveNormName(normId, dbNorm), [normId, dbNorm]);

  useEffect(() => {
    const resolved = resolveNormItems(normId, dbNorm);
    const merged = buildMerged(resolved);
    initialItemsRef.current = merged;
    init(normId, merged);
    return () => clear();
  }, [normId]);

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

  const dirty = isDirty(initialItemsRef.current, items);

  const handleSave = useCallback(async () => {
    const result = await safeMutate(
      () => updateDailyNorm(normId, { items: JSON.stringify(items) }),
      'Не удалось сохранить норму',
    );
    if (result === undefined) return;
    toaster.success('Норма сохранена');
    onClose();
  }, [normId, items, onClose]);

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
            <span className={styles.title}>{normName}</span>
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
            className={styles.closeBtn}
            onClick={handleRequestClose}
            type="button"
          >
            Закрыть редактирование
          </button>
        </div>
      </div>
    </ModalLayout>
  );
};

export default EditDailyNormModal;
