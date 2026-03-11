import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodsNutrients.module.scss';
import { Instance } from 'mobx-state-tree';
import { ScheduleFoods } from '@/domain/schedule/scheduleFood';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Nutrients } from '@/components/entities/nutrient/NutrientGroup';
import { Overlay } from '@/components/entities/nutrient/NutrientGroup/Overlay';
import { OpenDailyNorms } from '@/components/features/dailyNorms/OpenDailyNorms';
import { TotalNutrientsStore } from '@/components/features/builders/TotalNutrients/TotalNutrients/store/TotalNutrientsStore';
import { useMemo, useCallback, useState } from 'react';
import { FilterButton } from '@/components/ui/atoms/Button';
import NutrientCardV2 from '@/components/entities/nutrient/NutrientCard/NutrientCardV2';
import clsx from 'clsx';

type Props = {
  schedule: Instance<typeof ScheduleFoods>;
};

const EyeOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const ScheduleFoodsNutrients = ({ schedule }: Props) => {
  const [filterMode, setFilterMode] = useState(false);
  const [hiddenNutrients, setHiddenNutrients] = useState<Set<string>>(new Set());
  const [showValues, setShowValues] = useState(true);
  const [showProgress, setShowProgress] = useState(true);

  const nutrientStore = useMemo(() => TotalNutrientsStore.create(), []);
  nutrientStore.setEntity(schedule);

  const isLoading = useCallback(() => nutrientStore.isOneOfProductsIsLoading, [nutrientStore]);

  const renderOverlay = useCallback(
    (value: string) => <Overlay loading={isLoading}>{value}</Overlay>,
    [isLoading]
  );

  const handleToggleHidden = useCallback((id: string) => {
    setHiddenNutrients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleFilterMode = () => {
    setFilterMode((prev) => !prev);
  };

  const renderCard = useCallback(
    (nutrientData: {
      id: string;
      name: string;
      displayName: string;
      displayNameRu: string;
      unit: string;
      unitRu: string;
    }) => {
      const isHidden = hiddenNutrients.has(nutrientData.id);

      if (isHidden && !filterMode) {
        return null;
      }

      return (
        <div
          className={clsx(styles.cardWrapper, isHidden && styles.hiddenCard)}
          onClick={filterMode ? () => handleToggleHidden(nutrientData.id) : undefined}
        >
          <NutrientCardV2
            content={nutrientData}
            getValue={nutrientStore.getValue}
            renderOverlay={renderOverlay}
            showValues={showValues}
            showProgress={showProgress}
          />
          {filterMode && (
            <div className={styles.eyeOverlay}>
              {isHidden ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </div>
          )}
        </div>
      );
    },
    [
      filterMode,
      hiddenNutrients,
      handleToggleHidden,
      nutrientStore.getValue,
      renderOverlay,
      showValues,
      showProgress,
    ]
  );

  return (
    <Screen
      bottomRight={<FilterButton onClick={toggleFilterMode} isActive={filterMode} />}
      actions={
        filterMode ? (
          <div className={styles.actionsPanel}>
            <button
              type="button"
              className={clsx(styles.toggleBtn, !showProgress && styles.toggleBtnOff)}
              onClick={() => setShowProgress((v) => !v)}
            >
              Шкала
            </button>
            <button
              type="button"
              className={clsx(styles.toggleBtn, !showValues && styles.toggleBtnOff)}
              onClick={() => setShowValues((v) => !v)}
            >
              Значения
            </button>
            <FilterButton onClick={toggleFilterMode} isActive={filterMode} />
          </div>
        ) : (
          <div></div>
        )
      }
    >
      <Nutrients
        store={nutrientStore}
        renderOverlay={renderOverlay}
        asControlledForm={false}
        renderCard={renderCard}
      />
      <OpenDailyNorms />

      {schedule.foodWithNoNutrients.length > 0 && (
        <div className={styles.messageContainer}>
          <p>Без продуктов</p>
          <div className={styles.messageContainerRow}>
            {schedule.foodWithNoNutrients.map((food) => (
              <span key={food.id}>{food.name}</span>
            ))}{' '}
          </div>
          <p>(нет данных по ценности)</p>
        </div>
      )}
    </Screen>
  );
};

export default observer(ScheduleFoodsNutrients);
