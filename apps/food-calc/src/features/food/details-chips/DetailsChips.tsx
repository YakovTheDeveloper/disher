import { useMemo } from 'react';
import clsx from 'clsx';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import { getSuggestionsForProduct } from '@/shared/data/tag-suggestions';
import { useCustomTagsByProduct } from '@/entities/custom-tag';
import { useProduct } from '@/entities/product';
import { hasTag, normalizeTag, toggleTag } from '@/shared/lib/details/tags';
import styles from './DetailsChips.module.scss';

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** Product id (catalog or user). When null (dish entries, no product) the
   *  chip-row collapses and only the textarea is shown. */
  productId: string | null;
  textareaId: string;
  placeholder?: string;
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

export function DetailsChips({
  value,
  onChange,
  productId,
  textareaId,
  placeholder = 'Заметка к записи...',
}: Props) {
  const product = useProduct(productId ?? undefined);
  const customTagRows = useCustomTagsByProduct(productId);

  const chips = useMemo<ChipEntry[]>(() => {
    const categories = readCategories(product);
    const suggestions = getSuggestionsForProduct(categories);
    const seen = new Set<string>();
    const out: ChipEntry[] = [];
    for (const s of suggestions) {
      const norm = normalizeTag(s);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      out.push({ tag: s, source: 'suggestion' });
    }
    for (const row of customTagRows) {
      const norm = normalizeTag(row.tag);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      out.push({ tag: row.tag, source: 'custom' });
    }
    return out;
  }, [product, customTagRows]);

  const handleToggle = (tag: string) => {
    onChange(toggleTag(value, tag));
  };

  return (
    <div className={styles.root}>
      {chips.length > 0 && (
        <div className={styles.chips} role="group" aria-label="Особенности">
          {chips.map(({ tag, source }) => {
            const active = hasTag(value, tag);
            return (
              <button
                key={tag}
                type="button"
                className={clsx(
                  styles.chip,
                  active && styles.active,
                  source === 'custom' && styles.custom,
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToggle(tag)}
                aria-pressed={active}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
      <Textarea
        id={textareaId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        maxLength={500}
        debounceTime={0}
      />
    </div>
  );
}

export default DetailsChips;
