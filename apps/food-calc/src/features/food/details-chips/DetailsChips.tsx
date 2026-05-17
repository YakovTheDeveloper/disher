import { useMemo } from 'react';
import clsx from 'clsx';
import { getSuggestionsForProduct } from '@/shared/data/tag-suggestions';
import { useCustomTagsByProduct } from '@/entities/custom-tag';
import { useProduct } from '@/entities/product';
import { hasTag, normalizeTag, toggleTag } from '@/shared/lib/details/tags';
import styles from './DetailsChips.module.scss';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';

type Props = {
  value: string;
  onChange: (next: string) => void;
  /** Product id (catalog or user). When null (dish entries, no product) the
   *  chip-row collapses and only the textarea is shown. */
  productId: string | null;
  textareaId: string;
  placeholder?: string;
  /** When false — suggestion + custom chips render as one flat flow without
   *  the «Особенности» / «Ваши теги» sub-labels (used by DetailsStep, where a
   *  single section heading sits above and vertical space is at a premium). */
  showSectionLabels?: boolean;
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
  placeholder = 'Уточнение к записи...',
  showSectionLabels = true,
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

  const renderChip = ({ tag }: ChipEntry) => {
    const active = hasTag(value, tag);
    return (
      <button
        key={tag}
        type="button"
        className={clsx(styles.chip, active && styles.active)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleToggle(tag)}
        aria-pressed={active}
      >
        {tag}
      </button>
    );
  };

  const allChips = [...suggestionChips, ...customChips];

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

      {showSectionLabels ? (
        <>
          {suggestionChips.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Особенности</div>
              <div className={styles.chips} role="group" aria-label="Особенности">
                {suggestionChips.map(renderChip)}
              </div>
            </div>
          )}
          {customChips.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Ваши теги</div>
              <div className={styles.chips} role="group" aria-label="Ваши теги">
                {customChips.map(renderChip)}
              </div>
            </div>
          )}
        </>
      ) : (
        allChips.length > 0 && (
          <div className={styles.chips} role="group" aria-label="Особенности">
            {allChips.map(renderChip)}
          </div>
        )
      )}
    </div>
  );
}

export default DetailsChips;
