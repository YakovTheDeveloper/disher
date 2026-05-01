import {
  nutrientGroups,
  allNutrientsList,
  defaultDailyNorms,
} from '@/entities/nutrient/ui/NutrientGroup/constants';
import s from './NutrientDesignVariants.module.scss';
import clsx from 'clsx';
import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';

interface Props {
  getValue: (id: string) => number;
  variant?: 'view' | 'edit-norms' | 'edit-values';
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

const PentagonDecoration = ({ nutrientName }: { nutrientName: string }) => {
  const mainGradients: Record<string, { color1: string; color2: string }> = {
    protein: { color1: '#ffe32a', color2: '#ff9500' },
    fats: { color1: '#ea9629', color2: '#ff6b6b' },
    carbohydrates: { color1: '#ff453b', color2: '#ff9500' },
    fiber: { color1: '#5af96c', color2: '#00d084' },
    energy: { color1: '#ff5e40', color2: '#ff8c42' },
    sugar: { color1: '#ff2d80', color2: '#ff6eb4' },
    water: { color1: '#00bfff', color2: '#1e90ff' },
  };

  const colors = mainGradients[nutrientName] || mineralColors[nutrientName];
  const { color1 = '#999', color2 = '#ccc' } = colors || {};
  const gradientId = `pentagon-${nutrientName}`;

  return (
    <svg
      className={s.mineralsPentagon}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={color1} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color2} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <polygon
        points="24,4 42,17 36,38 12,38 6,17"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
};

const VitaminSun = ({ nutrientName }: { nutrientName: string }) => {
  const { color1 = '#ffb800', color2 = '#ffe082' } = vitaminColors[nutrientName] || {};
  const gradientId = `sun-${nutrientName}`;

  return (
    <svg
      className={s.vitaminSun}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color1} stopOpacity="0.75" />
          <stop offset="60%" stopColor={color2} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill={`url(#${gradientId})`} />
    </svg>
  );
};

const AminoAcidDiamond = ({ nutrientName }: { nutrientName: string }) => {
  const isEssential = essentialAminoAcids.has(nutrientName);
  const { color1, color2 } = isEssential
    ? aminoAcidEssentialColor
    : aminoAcidNonEssentialColor;
  const gradientId = `diamond-${nutrientName}`;

  return (
    <svg
      className={clsx(s.aminoAcidDiamond, isEssential ? s.aminoAcidEssential : s.aminoAcidNonEssential)}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color2} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <polygon points="24,6 42,24 24,42 6,24" fill={`url(#${gradientId})`} />
    </svg>
  );
};

const NutrientDesignVariants = ({ getValue, variant = 'view', onRichFood, onValueChange }: Props) => {
  const isEditNorms = variant === 'edit-norms';
  const isEditValues = variant === 'edit-values';
  const isView = variant === 'view';
  const [overlayOpen, setOverlayOpen] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const getPercentage = (nutrientId: string) => {
    const norm = defaultDailyNorms[Number(nutrientId)];
    if (!norm) return 0;
    return Math.round(Math.min((getValue(nutrientId) / norm) * 100, 999));
  };

  const getNorm = (nutrientId: string) => defaultDailyNorms[Number(nutrientId)] || 0;

  const getProgressClass = (pct: number, nutrientName?: string) => {
    // Nutrient-specific progress colors
    switch (nutrientName) {
      case 'fiber':
        return s.progressPurple;
      case 'carbohydrates':
        return s.progressOrange;
      case 'energy':
        return s.progressRed;
      case 'sugar':
        return s.progressPink;
      case 'water':
        return s.progressCyan;
      // Default gradient for protein, fats
      default:
        if (pct >= 100) return s.progressBlue;
        if (pct >= 70) return s.progressGreen;
        if (pct >= 30) return s.progressYellow;
        return s.progressGray;
    }
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
          {isView && (
            <span className={s.pct}>
              {pct}
              <span className={s.pctSign}>%</span>
            </span>
          )}
        </div>
        {(isView || isEditValues) && (
          <div className={s.progressTrack} style={{ opacity: Math.min(pct, 100) / 100 }}>
            <div
              className={`${s.progressBar} ${getProgressClass(pct, nutrient.name)}`}
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
              <span className={`${s.value} ${s.valueRight}`}>
                {norm}
                {nutrient.unitRu}
              </span>
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

    let decoration: JSX.Element | null = null;
    if (nutrient.group === 'minerals') {
      decoration = <PentagonDecoration nutrientName={nutrient.name} />;
    } else if (nutrient.group === 'vitamins') {
      decoration = <VitaminSun nutrientName={nutrient.name} />;
    } else if (nutrient.group === 'aminoAcids') {
      decoration = <AminoAcidDiamond nutrientName={nutrient.name} />;
    }

    const progressColor = groupColors?.color1;

    return (
      <div key={nutrient.id} className={`${s.row} ${s[nutrient.group]}`} data-nutrient={nutrient.name}>
        <div className={s.rowTop}>
          {decoration}
          <span className={s.name}>{nutrient.displayNameRu}</span>
          {isView && <span className={s.pct}>{norm ? `${pct}%` : ''}</span>}
        </div>
        {isView && norm > 0 && progressColor && (
          <div className={s.progressTrack} style={{ opacity: Math.min(pct, 100) / 100 }}>
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
              <span className={`${s.value} ${s.valueRight}`}>
                {norm ? `${norm}${nutrient.unitRu}` : ''}
              </span>
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
