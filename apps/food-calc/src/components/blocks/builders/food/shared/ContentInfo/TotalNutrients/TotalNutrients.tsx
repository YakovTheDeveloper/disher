import { observer } from 'mobx-react-lite';
import styles from './TotalNutrients.module.scss';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';
import { DayScheduleUI } from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { useCallback } from 'react';
import { foodStore } from '@/store/rootStore';
import { Overlay } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/Overlay';
import { Typography } from '@/components/ui/atoms/Typography';
import { NavLink } from 'react-router';
import { RouterLinks } from '@/router';
import { useTotalNutrients } from '@/components/blocks/builders/food/shared/ContentInfo/TotalNutrients/viewModel/TotalNutrientsViewModel';

export interface TotalNutrientsRef {
  calculate: () => void;
}

type Props = {
  children: React.ReactNode;
  vm: {
    schedule: DayScheduleUI;
  };
  ref: React.Ref<{
    calculate: () => void;
  }>;
};

const TotalNutrients = ({ vm, ref }: Props) => {
  const { prepareStore } = useTotalNutrients(vm, ref);

  console.log('TotalNutrients render');

  const renderOverlay = useCallback(
    (value: string) => (
      <Overlay loading={foodStore.requestState} currentId={prepareStore}>
        {value}
      </Overlay>
    ),
    [foodStore.requestState, prepareStore]
  );

  const getFoodModel = useCallback(() => foodStore, []);
  return (
    <div className={styles.container}>
      <Nutrients
        currentFood={prepareStore.products}
        getFood={getFoodModel}
        renderOverlay={renderOverlay}
      />
      <NavLink to={RouterLinks.DailyNorms}>
        <Typography variant="action">поменять норму</Typography>
      </NavLink>
    </div>
  );
};

export default observer(TotalNutrients);
