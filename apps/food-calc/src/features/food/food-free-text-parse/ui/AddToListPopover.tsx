import { useEffect, useMemo, useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { catalog } from '@/shared/data/catalog';
import styles from './AddToListPopover.module.scss';

interface DuplicateMatch {
  id: string;
  name: string;
  source: 'system' | 'user';
}

interface AddToListPopoverProps {
  anchor: HTMLElement | null;
  open: boolean;
  initialName: string;
  onClose: () => void;
  onUseExisting: (productId: string, name: string) => void;
  onCreateNew: (name: string) => void | Promise<void>;
}

const normalize = (s: string) => s.trim().toLowerCase();

export const AddToListPopover = ({
  anchor,
  open,
  initialName,
  onClose,
  onUseExisting,
  onCreateNew,
}: AddToListPopoverProps) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const userProducts = useLiveQuery(() => db.products.toArray(), []);

  const duplicate = useMemo<DuplicateMatch | null>(() => {
    const target = normalize(name);
    if (!target) return null;
    const inCatalog = catalog.find((p) => normalize(p.name) === target);
    if (inCatalog) return { id: inCatalog.id, name: inCatalog.name, source: 'system' };
    const inUser = userProducts?.find((p) => normalize(p.name) === target);
    if (inUser) return { id: inUser.id, name: inUser.name, source: 'user' };
    return null;
  }, [name, userProducts]);

  const { refs, floatingStyles, context } = useFloating({
    elements: { reference: anchor },
    open,
    onOpenChange: (next) => {
      if (!next) onClose();
    },
    whileElementsMounted: autoUpdate,
    placement: 'bottom-end',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const { getFloatingProps } = useInteractions([dismiss, role]);

  if (!open || !anchor) return null;

  const trimmed = name.trim();
  const submitNew = () => {
    if (!trimmed) return;
    onCreateNew(trimmed);
  };

  return (
    <FloatingPortal>
      <FloatingFocusManager context={context} initialFocus={-1}>
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className={styles.popover}
          data-base-ui-swipe-ignore=""
        >
          <p className={styles.title}>Добавить в свой список</p>
          <input
            className={styles.nameInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя продукта"
            autoFocus
            maxLength={120}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (duplicate) onUseExisting(duplicate.id, duplicate.name);
                else submitNew();
              }
            }}
          />
          {duplicate && (
            <p className={styles.dupHint}>
              Уже есть: <span className={styles.dupName}>{duplicate.name}</span>
              <span className={styles.dupSource}>
                · {duplicate.source === 'system' ? 'каталог' : 'мой список'}
              </span>
            </p>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>
              Отмена
            </button>
            {duplicate ? (
              <>
                <button type="button" className={styles.btnSecondary} onClick={submitNew}>
                  Создать новый
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => onUseExisting(duplicate.id, duplicate.name)}
                >
                  Использовать
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={submitNew}
                disabled={!trimmed}
              >
                Добавить
              </button>
            )}
          </div>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
};
