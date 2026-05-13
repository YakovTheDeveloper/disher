import { useCallback, useEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
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
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import CreateDailyNormModal from './CreateDailyNormModal';
import styles from './EditDailyNormModal.module.scss';

// chrome:
//   'modal' (default) — full modal with ModalLayout, kicker+title header, Close in footer
//   'panel' — inline content for a drawer that already provides its own header/back.
//             Skips ModalLayout, kicker+title, and the bottom Close button.
//             onRecalc: when provided, called instead of opening CreateDailyNormModal
//             on top (used by the drawer-two-state to swap to the 'create' panel).
type Props = BaseModalProps & {
  chrome?: 'modal' | 'panel';
  onRecalc?: () => void;
};

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

const EditDailyNormModal = ({ onClose, chrome = 'modal', onRecalc }: Props) => {
  const userItems = useUserNormItems();
  const { items, init, setNutrient, clear } = useDailyNormDraftStore();
  const initialItemsRef = useRef<DailyNormItems>({});
  const bodyRef = useRef<HTMLDivElement>(null);
  const initialisedRef = useRef(false);

  // Two effects on purpose:
  // 1) init runs once, but ONLY after Dexie has resolved. `userItems`
  //    starts as `undefined` while useLiveQuery loads; treating that as
  //    "no row" (and initing with defaults) races: when the real row
  //    later arrives, the guard short-circuits and the draft is stuck on
  //    defaults — Save would then overwrite the real norm with defaults.
  // 2) cleanup is its own zero-dep effect so `clear()` fires on unmount
  //    only — never between re-runs of effect (1).
  useEffect(() => {
    if (initialisedRef.current) return;
    if (userItems === undefined) return; // still loading
    const merged = buildMerged(userItems);
    initialItemsRef.current = merged;
    init(merged);
    initialisedRef.current = true;
  }, [userItems, init]);

  useEffect(() => () => clear(), [clear]);

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
      if (onRecalc) {
        // Panel mode (inside a drawer two-state) — parent switches to its
        // own 'create' panel instead of stacking a modal on top.
        onRecalc();
      } else {
        onClose();
        void modalStore.show(CreateDailyNormModal, {});
      }
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
  }, [dirty, onClose, onRecalc]);

  const handleFocusCapture = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const tag = target.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
    window.setTimeout(() => {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 120);
  }, []);

  const isPanel = chrome === 'panel';
  const isLoading = userItems === undefined;

  const content = (
    <div className={clsx(styles.root, isPanel && styles.rootPanel)}>
      <div className={clsx(styles.header, isPanel && styles.headerPanel)}>
        {!isPanel && (
          <div className={styles.titleWrap}>
            <span className={styles.kicker}>Дневная норма</span>
            <span className={styles.title}>{USER_NORM_NAME}</span>
          </div>
        )}
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!dirty || isLoading}
          type="button"
        >
          Сохранить
        </button>
      </div>
      <div
        ref={bodyRef}
        className={clsx(styles.body, isPanel && styles.bodyPanel)}
        onFocusCapture={handleFocusCapture}
      >
        {isLoading ? (
          <div className={styles.loadingState} aria-live="polite">
            <Spinner size={20} />
            <span className={styles.loadingText}>Загружаем норму…</span>
          </div>
        ) : (
          <NutrientDesignVariants
            variant="edit-norms"
            getValue={getDraftValue}
            onValueChange={handleValueChange}
          />
        )}
      </div>
      <div className={clsx(styles.footer, isPanel && styles.footerPanel)}>
        <button
          className={styles.recalcBtn}
          onClick={handleRecalc}
          type="button"
        >
          Пересчитать по анкете
        </button>
        {!isPanel && (
          <button
            className={styles.closeBtn}
            onClick={handleRequestClose}
            type="button"
          >
            Закрыть
          </button>
        )}
      </div>
    </div>
  );

  return isPanel ? content : <ModalLayout>{content}</ModalLayout>;
};

export default EditDailyNormModal;
