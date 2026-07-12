import { useEffect, useMemo, useRef } from 'react';
import { Chip, type ChipSurface } from '@/shared/ui/atoms/Chip';
import { getSuggestionsForProduct } from '@/shared/data/tag-suggestions';
import { useCustomTagsByProduct, removeCustomTag } from '@/entities/custom-tag';
import { useProduct } from '@/entities/product';
import { hasTag, normalizeTag, toggleTag } from '@/shared/lib/details/tags';
import { safeMutate } from '@/shared/lib/safeMutate';
import { drawerStore } from '@/shared/ui';
import { ConfirmDrawer } from '@/shared/ui/ConfirmDrawer';
import styles from './DetailsChips.module.scss';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { Text } from '@/shared/ui/atoms/Typography';

// Заливка «выбрано» чипов «Особенности» = сливовый (plum) + ink-текст + inset-тень
// «вдавленного тумблера». DesignBar-проба 'plum-press' выиграла 2026-07-05 и стала
// базой; цвет минтован в --ref-color-plum → --sys-color-bg-selected-plum. Стили —
// в DetailsChips.module.scss (.root).

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** Product id (catalog or user). When null (dish entries, no product) the
   *  chip-row collapses and only the textarea is shown. */
  productId: string | null;
  textareaId: string;
  placeholder?: string;
  /** Surface-тир хоста, на котором лежат чипы — пробрасывается в <Chip>. */
  surface?: ChipSurface;
};

function readCategories(product: { categories: string } | null): readonly string[] {
  if (!product) return [];
  try {
    const parsed = JSON.parse(product.categories);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

type ChipEntry = {
  tag: string;
  source: 'suggestion' | 'custom';
};

const LONG_PRESS_MS = 500;
// Если палец сдвинулся больше этого порога — считаем что юзер скроллит, не
// удерживает. Канон 2026 (Vaul, Radix long-press) — 6-10px; берём 8.
const LONG_PRESS_MOVE_THRESHOLD_PX = 8;

export function DetailsChips({
  value,
  onChange,
  productId,
  textareaId,
  placeholder = 'Уточнение к записи...',
  surface = 0,
}: Props) {
  const product = useProduct(productId ?? undefined);
  const customTagRows = useCustomTagsByProduct(productId);

  const { suggestionChips, customChips } = useMemo(() => {
    const categories = readCategories(product);
    const suggestions = getSuggestionsForProduct(categories);
    const seen = new Set<string>();
    const suggestionOut: ChipEntry[] = [];
    const customOut: ChipEntry[] = [];
    for (const s of suggestions) {
      const norm = normalizeTag(s);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      suggestionOut.push({ tag: s, source: 'suggestion' });
    }
    for (const row of customTagRows) {
      const norm = normalizeTag(row.tag);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      customOut.push({ tag: row.tag, source: 'custom' });
    }
    return { suggestionChips: suggestionOut, customChips: customOut };
  }, [product, customTagRows]);

  const handleToggle = (tag: string) => {
    onChange(toggleTag(value, tag));
  };

  const handleDeleteCustom = async (tag: string) => {
    if (!productId) return;
    const ok = await drawerStore.show(ConfirmDrawer, {
      title: `Удалить тег «${tag}»?`,
      confirmLabel: 'Удалить',
      tone: 'danger',
    });
    if (!ok) return;
    void safeMutate(() => removeCustomTag(productId, tag), 'Не удалось удалить тег');
  };

  return (
    <div className={styles.root}>
      <div className={styles.inputArea}>
        <AutoGrowSearch
          id={textareaId}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={500}
        />
      </div>

      {suggestionChips.length > 0 && (
        <div className={styles.chips} role="group" aria-label="Особенности">
          {suggestionChips.map(({ tag }) => {
            const active = hasTag(value, tag);
            return (
              <Chip
                key={tag}
                active={active}
                onSurface={surface}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToggle(tag)}
                aria-pressed={active}
              >
                {tag}
              </Chip>
            );
          })}
        </div>
      )}

      {customChips.length > 0 && (
        <div className={styles.customGroup}>
          <Text as="div" role="caption" className={styles.customLabel}>
            Ваши теги
          </Text>
          <div className={styles.chips} role="group" aria-label="Ваши теги">
            {customChips.map(({ tag }) => (
              <CustomChip
                key={tag}
                tag={tag}
                active={hasTag(value, tag)}
                surface={surface}
                onToggle={() => handleToggle(tag)}
                onDelete={() => handleDeleteCustom(tag)}
              />
            ))}
          </div>
          <Text as="p" role="caption" className={styles.hint}>
            Зажмите чтобы удалить
          </Text>
        </div>
      )}
    </div>
  );
}

type CustomChipProps = {
  tag: string;
  active: boolean;
  surface?: ChipSurface;
  onToggle: () => void;
  onDelete: () => void;
};

// Long-press (~500ms) opens a confirm + delete. Toggle on regular click is
// suppressed when the long-press fired so a hold doesn't also flip the chip.
function CustomChip({ tag, active, surface = 0, onToggle, onDelete }: CustomChipProps) {
  const timerRef = useRef<number | null>(null);
  const firedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  // clear НЕ трогает firedRef — иначе trailing click после Cancel в confirm
  // (PointerUp → clear → click) увидел бы firedRef=false и зря дёрнул onToggle.
  // Сброс firedRef живёт в handleClick (потребил → сбросил), это закрывает и
  // edge-case с synthetic-click после long-press + Cancel.
  const clear = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    firedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true;
      timerRef.current = null;
      onDelete();
    }, LONG_PRESS_MS);
  };

  // На touch браузер обычно шлёт pointercancel при распознавании скролла, но
  // не моментально. Доп. страховка: если палец уехал > threshold — отменяем
  // таймер сами, чтобы скролл листа не превращался в ложный confirm.
  const handlePointerMove = (e: React.PointerEvent) => {
    const start = startRef.current;
    if (!start || timerRef.current === null) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (dx * dx + dy * dy > LONG_PRESS_MOVE_THRESHOLD_PX * LONG_PRESS_MOVE_THRESHOLD_PX) {
      clear();
    }
  };

  const handleClick = () => {
    if (firedRef.current) {
      firedRef.current = false;
      return;
    }
    onToggle();
  };

  useEffect(() => clear, []);

  return (
    <Chip
      active={active}
      onSurface={surface}
      // styles.customChipPress отключает iOS callout/text-selection для long-press
      // явно на корне CustomChip — не зависит от структуры Chip (см. SCSS-комментарий).
      className={styles.customChipPress}
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onContextMenu={(e) => e.preventDefault()}
      onClick={handleClick}
      aria-pressed={active}
    >
      {tag}
    </Chip>
  );
}

export default DetailsChips;
