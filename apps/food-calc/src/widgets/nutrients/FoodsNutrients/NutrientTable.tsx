import {
  nutrientGroups,
  allNutrientsList,
  defaultDailyNorms,
} from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useUserNormItems } from '@/entities/daily-norm';
import { NutrientRow } from '@/entities/nutrient/ui/NutrientRow';
import s from './NutrientTable.module.scss';
import clsx from 'clsx';
import { memo, useCallback, useRef, useState, useEffect } from 'react';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';

interface Props {
  getValue: (id: string) => number;
  variant?: 'view' | 'edit-norms' | 'edit-values' | 'view-norms';
  onRichFood?: (nutrientId: string, unit: string) => void;
  onValueChange?: (nutrientId: string, value: number) => void;
}

// Цвета нутриентов запечены в один mist-акцент (см. NutrientTable.module.scss):
// один бледный wash под именами БЖУ + один акцент на прогресс-барах. Радуга и
// design-форки (vivid/graphite/paper/mist) убраны.
const NutrientTable = ({ getValue, variant = 'view', onRichFood, onValueChange }: Props) => {
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
  // В режиме правки (edit-values) карточка = только имя + инпут: ни %, ни бара,
  // ни нормы. Поэтому прогресс-бар теперь только в просмотре.
  const showProgress = isView && hasNorm;
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

  // Правки нутриентов коммитятся в БД на BLUR, не на каждый символ: держим
  // черновик ввода локально, чтобы не писать в Dexie на каждое нажатие (и не
  // ловить delete-on-zero посреди набора). На blur — onValueChange + очистка.
  const [editDraft, setEditDraft] = useState<Record<string, number>>({});
  const editFieldValue = (id: string, fallback: number) => editDraft[id] ?? fallback;
  const handleEditChange = (id: string, v: number) =>
    setEditDraft((d) => ({ ...d, [id]: v }));
  const handleEditBlur = (id: string, v: number) => {
    onValueChange?.(id, v);
    setEditDraft((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
  };

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

    // view-norms = единый ряд (NutrientRow): имя · норма+юнит, как в пикере.
    if (isViewNorms) {
      return (
        <NutrientRow
          key={nutrient.id}
          name={nutrient.displayNameRu}
          value={Math.round(norm)}
          unit={nutrient.unitRu}
        />
      );
    }

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
        <div className={clsx(s.rowBottom, isView && s.rowBottomBar)}>
          {isView && (
            <>
              <span className={clsx(s.value, s.valueLeft)}>
                <span>{Math.round(value)}</span>
                <span className={s.unit}>{nutrient.unitRu}</span>
              </span>
              {showProgress && (
                <div className={s.progressTrack}>
                  <div
                    className={s.progressBar}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              )}
              {hasNorm && (
                <span className={`${s.value} ${s.valueRight}`}>
                  <span>{norm}</span>
                  <span className={s.unit}>{nutrient.unitRu}</span>
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
              <div className={s.editInputRight}>
                <NumberInput
                  value={editFieldValue(nutrient.id, Math.round(value))}
                  onChange={(v) => handleEditChange(nutrient.id, v)}
                  onBlur={(v) => handleEditBlur(nutrient.id, v)}
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

    // view-norms = единый ряд (NutrientRow). Нет нормы → тире без юнита.
    if (isViewNorms) {
      const hasValue = norm > 0;
      return (
        <NutrientRow
          key={nutrient.id}
          name={nutrient.displayNameRu}
          value={hasValue ? (nutrient.unitRu === 'г' ? Math.round(norm) : norm) : '—'}
          unit={hasValue ? nutrient.unitRu : ''}
        />
      );
    }

    return (
      <div key={nutrient.id} className={`${s.row} ${s[nutrient.group]}`} data-nutrient={nutrient.name}>
        <div className={s.rowTop}>
          <span className={s.name}>{nutrient.displayNameRu}</span>
          {showPctView && <span className={s.pct}>{norm ? `${pct}%` : ''}</span>}
        </div>
        <div className={clsx(s.rowBottom, isView && s.rowBottomBar)}>
          {isView && (
            <>
              <span className={clsx(s.value, s.valueLeft)}>
                <span>{nutrient.unitRu === 'г' ? Math.round(value) : value.toFixed(1)}</span>
                <span className={s.unit}>{nutrient.unitRu}</span>
              </span>
              {showProgress && norm > 0 && (
                <div className={s.progressTrack}>
                  <div
                    className={s.progressBar}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              )}
              {hasNorm && (
                <span className={`${s.value} ${s.valueRight}`}>
                  {norm ? (
                    <>
                      <span>{norm}</span>
                      <span className={s.unit}>{nutrient.unitRu}</span>
                    </>
                  ) : (
                    ''
                  )}
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
              <div className={s.editInputRight}>
                <NumberInput
                  value={editFieldValue(
                    nutrient.id,
                    nutrient.unitRu === 'г' ? Math.round(value) : Number(value.toFixed(1)),
                  )}
                  onChange={(v) => handleEditChange(nutrient.id, v)}
                  onBlur={(v) => handleEditBlur(nutrient.id, v)}
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

  // view-norms (экран «Моя норма») — плоский сгруппированный список как в пикере
  // нутриентов: заголовок группы (БЖУ / Минералы / …) над списком NutrientRow
  // с затухающими бровками. Бровка :last-child гасится → граница между группами
  // держится зазором + заголовком следующей группы.
  if (isViewNorms) {
    const normGroups: Array<{ key: string; title: string; rows: JSX.Element[] }> = [
      { key: 'main', title: nutrientGroups[0].displayName, rows: mainNutrients.map(renderRow) },
      ...nutrientGroups.slice(1).map((group) => ({
        key: group.name,
        title: group.displayName,
        rows: group.content.map(renderGroupRow),
      })),
    ];
    return (
      <div className={clsx(s.container, s.containerNorms)}>
        {normGroups.map((group) => (
          <section key={group.key} className={s.normGroup}>
            <h3 className={s.normGroupTitle}>{group.title}</h3>
            <div className={s.normList}>{group.rows}</div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.section}>{mainNutrients.map(renderRow)}</div>

      {nutrientGroups.slice(1).map((group) => (
        <div key={group.name} className={`${s.section} ${s[group.name]}`}>
          {group.content.map(renderGroupRow)}
        </div>
      ))}
    </div>
  );
};

export default memo(NutrientTable);
