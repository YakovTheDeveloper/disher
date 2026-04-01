import {
  nutrientGroups,
  allNutrientsList,
  defaultDailyNorms,
} from '@/entities/nutrient/ui/NutrientGroup/constants';
import s from './NutrientDesignVariants.module.scss';
import clsx from 'clsx';

interface Props {
  getValue: (id: string) => number;
}

const PentagonDecoration = ({ nutrientName }: { nutrientName: string }) => {
  const gradients: Record<string, { color1: string; color2: string }> = {
    protein: { color1: '#ffe32a', color2: '#ff9500' },
    fats: { color1: '#ea9629', color2: '#ff6b6b' },
    carbohydrates: { color1: '#ff453b', color2: '#ff9500' },
    fiber: { color1: '#5af96c', color2: '#00d084' },
    energy: { color1: '#ff5e40', color2: '#ff8c42' },
    sugar: { color1: '#ff2d80', color2: '#ff6eb4' },
    water: { color1: '#00bfff', color2: '#1e90ff' },
    // Minerals defaults
    calcium: { color1: '#a855f7', color2: '#d8b4fe' },
    phosphorus: { color1: '#ff9d4d', color2: '#ffc266' },
    magnesium: { color1: '#4caf50', color2: '#81c784' },
  };

  const { color1 = '#999', color2 = '#ccc' } = gradients[nutrientName] || {};
  const gradientId = `pentagon-${nutrientName}`;

  return (
    <svg
      className={s.mineralsPentagon}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: 'rotate(45deg)',
        filter: 'blur(2px)',
        opacity: 0.5
      }}
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
      {/* Pentagon: 5 points around a circle */}
      <polygon
        points="24,4 42,17 36,38 12,38 6,17"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
};

const NutrientDesignVariants = ({ getValue }: Props) => {
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

    return (
      <div
        key={nutrient.id}
        className={`${s.row} ${s[nutrient.group]}`}
        data-nutrient={nutrient.name}
      >
        <div className={s.rowTop}>
          <span className={s.name}>{nutrient.displayNameRu}</span>
          <span className={s.dots} />
          <span className={s.pct}>
            {pct}
            <span className={s.pctSign}>%</span>
          </span>
        </div>
        <div className={s.progressTrack} style={{ opacity: Math.min(pct, 100) / 100 }}>
          <div
            className={`${s.progressBar} ${getProgressClass(pct, nutrient.name)}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className={s.rowBottom}>
          <span className={clsx(s.value, s.valueLeft)}>
            <span>{Math.round(value)}</span>
            <span>{nutrient.unitRu}</span>
          </span>
          <span className={`${s.value} ${s.valueRight}`}>
            {norm}
            {nutrient.unitRu}
          </span>
        </div>
      </div>
    );
  };

  const renderGroupRow = (nutrient: (typeof mainNutrients)[0]) => {
    const value = getValue(nutrient.id);
    const norm = getNorm(nutrient.id);
    const pct = getPercentage(nutrient.id);
    const isMineralGroup = nutrient.group === 'minerals';

    return (
      <div key={nutrient.id} className={`${s.row} ${s[nutrient.group]}`}>
        <div className={s.rowTop}>
          {isMineralGroup && <PentagonDecoration nutrientName={nutrient.name} />}
          <span className={s.name}>{nutrient.displayNameRu}</span>
          <span className={s.pct}>{norm ? `${pct}%` : ''}</span>
        </div>
        <div className={s.rowBottom}>
          <span className={clsx(s.value, s.valueLeft)}>
            {nutrient.unitRu === 'г' ? Math.round(value) : value.toFixed(1)}
            {nutrient.unitRu}
          </span>
          <span className={`${s.value} ${s.valueRight}`}>
            {norm ? `${norm}${nutrient.unitRu}` : ''}
          </span>
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

export default NutrientDesignVariants;
