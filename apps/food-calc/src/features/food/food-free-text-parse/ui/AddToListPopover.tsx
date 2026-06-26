import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/shared/lib/dexie/schema';
import { catalog } from '@/shared/data/catalog';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Typography';
import type { BaseDrawerProps } from '@/shared/ui';
import styles from './AddToListPopover.module.scss';

interface DuplicateMatch {
  id: string;
  name: string;
  source: 'system' | 'user';
}

// Имя сохранено (`AddToListPopover`) ради baselined-теста InlineWriteFoodReview,
// который мокает этот путь/именованный экспорт; по сути теперь это bottom-sheet
// drawer «Новый продукт», а не floating-popover (Slice 12: переезд на drawerStore,
// drawer-side-via-store).
interface AddToListProps extends BaseDrawerProps<void> {
  initialName: string;
  /** Выбрать существующий продукт (1 совпадение или пункт из списка при N>1). */
  onUseExisting: (productId: string, name: string) => void;
  /** Создать новый продукт. Возвращает успех — drawer закрывается только при true
   *  (на провале createProduct остаётся открытым, тостер уже сообщил об ошибке). */
  onCreateNew: (name: string) => boolean | Promise<boolean>;
}

const normalize = (s: string) => s.trim().toLowerCase();

export const AddToListPopover = ({
  initialName,
  onClose,
  onUseExisting,
  onCreateNew,
}: AddToListProps) => {
  const [name, setName] = useState(initialName);

  const userProducts = useLiveQuery(() => db.products.toArray(), []);

  // ВСЕ совпадения (каталог + свои), не только первое — N>1 рисует мини-список
  // «выбрать какой» (план Slice 12). Каталог идёт первым (системные эталоны).
  const matches = useMemo<DuplicateMatch[]>(() => {
    const target = normalize(name);
    if (!target) return [];
    const out: DuplicateMatch[] = [];
    for (const p of catalog) {
      if (normalize(p.name) === target) out.push({ id: p.id, name: p.name, source: 'system' });
    }
    for (const p of userProducts ?? []) {
      if (normalize(p.name) === target) out.push({ id: p.id, name: p.name, source: 'user' });
    }
    return out;
  }, [name, userProducts]);

  const trimmed = name.trim();

  const handleUseExisting = (productId: string, existingName: string) => {
    onUseExisting(productId, existingName);
    onClose();
  };

  const handleCreate = async () => {
    if (!trimmed) return;
    const ok = await onCreateNew(trimmed);
    if (ok) onClose();
  };

  // Enter = первичное действие: ровно 1 совпадение → использовать его, иначе
  // (0 или N>1) → создать новый.
  const handleSubmit = () => {
    if (matches.length === 1) handleUseExisting(matches[0].id, matches[0].name);
    else void handleCreate();
  };

  const sourceLabel = (source: DuplicateMatch['source']) =>
    source === 'system' ? 'каталог' : 'мой список';

  return (
    <DrawerLayout title="Новый продукт" a11yLabel="Новый продукт">
      <div className={styles.body}>
        {/* Без autoFocus — iOS всё равно блокирует программный focus (ios-focus). */}
        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя продукта"
          maxLength={120}
          data-base-ui-swipe-ignore=""
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {matches.length === 1 && (
          <Text as="p" role="caption" className={styles.dupHint}>
            Уже есть:{' '}
            <Text as="span" role="caption" className={styles.dupName}>
              {matches[0].name}
            </Text>
            <Text as="span" role="caption" className={styles.dupSource}>
              · {sourceLabel(matches[0].source)}
            </Text>
          </Text>
        )}

        {matches.length > 1 && (
          <Text as="p" role="caption" className={styles.dupHint}>
            Похожие уже есть — выберите или создайте новый:
          </Text>
        )}

        <div className={styles.actions}>
          {matches.length > 1 &&
            matches.map((m) => (
              <Button
                key={`${m.source}-${m.id}`}
                variant="system-secondary"
                fullWidth
                onClick={() => handleUseExisting(m.id, m.name)}
              >
                {m.name} · {sourceLabel(m.source)}
              </Button>
            ))}

          {matches.length === 1 && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => handleUseExisting(matches[0].id, matches[0].name)}
            >
              Использовать существующий
            </Button>
          )}

          <Button
            variant={matches.length === 1 ? 'system-secondary' : 'primary'}
            fullWidth
            onClick={() => void handleCreate()}
            disabled={!trimmed}
          >
            {matches.length === 0 ? 'Создать' : 'Создать новый'}
          </Button>
        </div>
      </div>
    </DrawerLayout>
  );
};
