import {
  nutrientGroups,
  allNutrientsList,
  defaultDailyNorms,
} from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useUserNormItems } from '@/entities/daily-norm';
import s from './NutrientDesignVariants.module.scss';
import clsx from 'clsx';
import { memo, useCallback, useRef, useState, useEffect, type CSSProperties } from 'react';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';

interface Props {
  getValue: (id: string) => number;
  variant?: 'view' | 'edit-norms' | 'edit-values' | 'view-norms';
  onRichFood?: (nutrientId: string, unit: string) => void;
  onValueChange?: (nutrientId: string, value: number) => void;
}

const mineralColors: Record<string, { color1: string; color2: string }> = {
  iron: { color1: '#c0392b', color2: '#e57373' },
  magnesium: { color1: '#4caf50', color2: '#81c784' },
  phosphorus: { color1: '#ff9d4d', color2: '#ffc266' },
  calcium: { color1: '#a855f7', color2: '#d8b4fe' },
  potassium: { color1: '#5b9cf6', color2: '#90caf9' },
  sodium: { color1: '#78909c', color2: '#b0bec5' },
  zinc: { color1: '#90a4ae', color2: '#cfd8dc' },
  copper: { color1: '#b87333', color2: '#d4a373' },
  manganese: { color1: '#8d6e63', color2: '#bcaaa4' },
  selenium: { color1: '#9e9d24', color2: '#cddc39' },
  iodine: { color1: '#6a1b9a', color2: '#ba68c8' },
};

const vitaminColors: Record<string, { color1: string; color2: string }> = {
  vitaminA: { color1: '#ff8c42', color2: '#ffcc80' },
  vitaminC: { color1: '#ffd60a', color2: '#fff176' },
  vitaminD: { color1: '#ffb800', color2: '#ffe082' },
  vitaminE: { color1: '#9cc962', color2: '#c5e1a5' },
  vitaminK: { color1: '#2e7d32', color2: '#81c784' },
  vitaminB1: { color1: '#f48fb1', color2: '#f8bbd0' },
  vitaminB2: { color1: '#f48fb1', color2: '#f8bbd0' },
  vitaminB3: { color1: '#f48fb1', color2: '#f8bbd0' },
  vitaminB4: { color1: '#f48fb1', color2: '#f8bbd0' },
  vitaminB5: { color1: '#f48fb1', color2: '#f8bbd0' },
  vitaminB6: { color1: '#f48fb1', color2: '#f8bbd0' },
  vitaminB7: { color1: '#f48fb1', color2: '#f8bbd0' },
  vitaminB9: { color1: '#f48fb1', color2: '#f8bbd0' },
  vitaminB12: { color1: '#f48fb1', color2: '#f8bbd0' },
  betaCarotene: { color1: '#ff7043', color2: '#ffab91' },
  alphaCarotene: { color1: '#ff7043', color2: '#ffab91' },
};

const essentialAminoAcids = new Set([
  'tryptophan', 'threonine', 'isoleucine', 'leucine', 'lysine',
  'methionine', 'phenylalanine', 'valine', 'histidine',
  'cystine', 'tyrosine',
]);

const aminoAcidEssentialColor = { color1: '#ff7a59', color2: '#ffab91' };
const aminoAcidNonEssentialColor = { color1: '#7a9cc6', color2: '#b0c4de' };

const getGroupColors = (nutrientName: string, group: string) => {
  if (group === 'minerals') return mineralColors[nutrientName];
  if (group === 'vitamins') return vitaminColors[nutrientName];
  if (group === 'aminoAcids') {
    return essentialAminoAcids.has(nutrientName)
      ? aminoAcidEssentialColor
      : aminoAcidNonEssentialColor;
  }
  return undefined;
};

const NutrientDesignVariants = ({ getValue, variant = 'view', onRichFood, onValueChange }: Props) => {
  const isEditNorms = variant === 'edit-norms';
  const isEditValues = variant === 'edit-values';
  const isView = variant === 'view';
  const isViewNorms = variant === 'view-norms';
  const [overlayOpen, setOverlayOpen] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const userItems = useUserNormItems();
  // Hide percent / progress / target column in view mode until the user has
  // configured their own daily norm. The empty-state banner ("подбери норму…")
  // is the call to action; showing default-based percentages alongside would
  // contradict it.
  // `!= null` covers both null (no row) AND undefined (still loading from
  // IDB). Showing pct/progress while loading would briefly flash defaults.
  const hasNorm = userItems != null;
  const showProgress = (isView && hasNorm) || isEditValues;
  const showPctView = isView && hasNorm;

  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOverlayOpen(null);
      }
    },
    []
  );

  useEffect(() => {
    if (overlayOpen) {
      document.addEventListener('pointerdown', handleOutsideClick);
      return () => document.removeEventListener('pointerdown', handleOutsideClick);
    }
  }, [overlayOpen, handleOutsideClick]);

  const findNutrient = (name: string) => allNutrientsList.find((n) => n.name === name);

  const mainNutrients = [
    findNutrient('protein')!,
    findNutrient('fats')!,
    findNutrient('carbohydrates')!,
    findNutrient('fiber')!,
    findNutrient('energy')!,
    findNutrient('sugar')!,
    findNutrient('water')!,
  ];

  const getNorm = (nutrientId: string) =>
    userItems?.[nutrientId] ?? defaultDailyNorms[Number(nutrientId)] ?? 0;

  const getPercentage = (nutrientId: string) => {
    const norm = getNorm(nutrientId);
    if (!norm) return 0;
    return Math.round(Math.min((getValue(nutrientId) / norm) * 100, 999));
  };

  const renderRow = (nutrient: (typeof mainNutrients)[0]) => {
    const value = getValue(nutrient.id);
    const norm = getNorm(nutrient.id);
    const pct = getPercentage(nutrient.id);
    const isOverlayOpen = overlayOpen === nutrient.id;
    const showOverlay = isView && onRichFood;

    const handleRowClick = () => {
      if (showOverlay) {
        setOverlayOpen(isOverlayOpen ? null : nutrient.id);
      }
    };

    const rowContent = (
      <div
        key={nutrient.id}
        className={`${s.row} ${s[nutrient.group]} ${showOverlay ? s.clickable : ''}`}
        data-nutrient={nutrient.name}
        onClick={handleRowClick}
        ref={showOverlay ? wrapperRef : undefined}
      >
        <div className={s.rowTop}>
          <span className={s.name}>{nutrient.displayNameRu}</span>
          <span className={s.dots} />
          {showPctView && (
            <span className={s.pct}>
              {pct}
              <span className={s.pctSign}>%</span>
            </span>
          )}
        </div>
        {showProgress && (
          <div className={s.progressTrack}>
            <div
              className={s.progressBar}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        )}
        <div className={s.rowBottom}>
          {isView && (
            <>
              <span className={clsx(s.value, s.valueLeft)}>
                <span>{Math.round(value)}</span>
                <span>{nutrient.unitRu}</span>
              </span>
              {hasNorm && (
                <span className={`${s.value} ${s.valueRight}`}>
                  {norm}
                  {nutrient.unitRu}
                </span>
              )}
            </>
          )}
          {isEditNorms && (
            <div className={s.editRow}>
              <NumberInput
                value={norm}
                onChange={(v) => onValueChange?.(nutrient.id, v)}
                className={s.editInput}
              />
              <span className={s.unitProminent}>{nutrient.unitRu}</span>
            </div>
          )}
          {isEditValues && (
            <div className={s.editRow}>
              <span className={clsx(s.value, s.valueLeft)}>
                {pct}<span className={s.pctSign}>%</span>
              </span>
              <div className={s.editInputRight}>
                <NumberInput
                  value={Math.round(value)}
                  onChange={(v) => onValueChange?.(nutrient.id, v)}
                  className={s.editInput}
                />
                <span className={s.unitProminent}>{nutrient.unitRu}</span>
              </div>
            </div>
          )}
          {isViewNorms && (
            <span className={clsx(s.value, s.valueLeft)}>
              <span>{Math.round(norm)}</span>
              <span>{nutrient.unitRu}</span>
            </span>
          )}
        </div>
        {showOverlay && isOverlayOpen && (
          <div className={s.overlay}>
            <button
              className={s.overlayBtn}
              onClick={(e) => {
                e.stopPropagation();
                if (onRichFood) onRichFood(nutrient.id, nutrient.unitRu);
                setOverlayOpen(null);
              }}
            >
              Богатые продукты
            </button>
          </div>
        )}
      </div>
    );

    return rowContent;
  };

  const renderGroupRow = (nutrient: (typeof mainNutrients)[0]) => {
    const value = getValue(nutrient.id);
    const norm = getNorm(nutrient.id);
    const pct = getPercentage(nutrient.id);
    const groupColors = getGroupColors(nutrient.name, nutrient.group);
    const progressColor = groupColors?.color1;

    return (
      <div key={nutrient.id} className={`${s.row} ${s[nutrient.group]}`} data-nutrient={nutrient.name}>
        <div className={s.rowTop}>
          {groupColors && (
            <span
              className={s.deco}
              aria-hidden="true"
              style={
                {
                  '--deco-c1': groupColors.color1,
                  '--deco-c2': groupColors.color2,
                } as CSSProperties
              }
            />
          )}
          <span className={s.name}>{nutrient.displayNameRu}</span>
          {showPctView && <span className={s.pct}>{norm ? `${pct}%` : ''}</span>}
        </div>
        {showProgress && norm > 0 && progressColor && (
          <div className={s.progressTrack}>
            <div
              className={s.progressBar}
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: `linear-gradient(45deg, transparent 0%, ${progressColor} 100%)`,
              }}
            />
          </div>
        )}
        <div className={s.rowBottom}>
          {isView && (
            <>
              <span className={clsx(s.value, s.valueLeft)}>
                {nutrient.unitRu === 'г' ? Math.round(value) : value.toFixed(1)}
                {nutrient.unitRu}
              </span>
              {hasNorm && (
                <span className={`${s.value} ${s.valueRight}`}>
                  {norm ? `${norm}${nutrient.unitRu}` : ''}
                </span>
              )}
            </>
          )}
          {isEditNorms && (
            <div className={s.editRow}>
              <NumberInput
                value={norm}
                onChange={(v) => onValueChange?.(nutrient.id, v)}
                className={s.editInput}
              />
              <span className={s.unitProminent}>{nutrient.unitRu}</span>
            </div>
          )}
          {isEditValues && (
            <div className={s.editRow}>
              <span className={clsx(s.value, s.valueLeft)}>
                {norm ? `${pct}%` : ''}
              </span>
              <div className={s.editInputRight}>
                <NumberInput
                  value={nutrient.unitRu === 'г' ? Math.round(value) : Number(value.toFixed(1))}
                  onChange={(v) => onValueChange?.(nutrient.id, v)}
                  className={s.editInput}
                />
                <span className={s.unitProminent}>{nutrient.unitRu}</span>
              </div>
            </div>
          )}
          {isViewNorms && (
            <span className={clsx(s.value, s.valueLeft)}>
              {norm
                ? `${nutrient.unitRu === 'г' ? Math.round(norm) : norm}${nutrient.unitRu}`
                : '—'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={s.container}>
      <div className={s.section}>{mainNutrients.map(renderRow)}</div>

      {nutrientGroups.slice(1).map((group) => (
        <div key={group.name} className={`${s.section} ${s[group.name]}`}>
          <h3 className={s.groupTitle}>{group.displayName}</h3>
          {group.content.map(renderGroupRow)}
        </div>
      ))}
    </div>
  );
};

export default memo(NutrientDesignVariants);
