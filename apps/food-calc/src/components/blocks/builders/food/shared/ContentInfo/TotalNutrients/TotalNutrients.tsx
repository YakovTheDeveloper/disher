import { observer, useLocalObservable } from 'mobx-react-lite';
import styles from './TotalNutrients.module.scss';
import { Nutrients } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients';
import {
  DayScheduleUI,
  makeScheduleItemsSignature,
} from '@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel';
import { useCallback, useRef, useState, useEffect } from 'react';
import {
  getAllFoodIds,
  getTotalFoodAndDishFoodQuantityFromAll,
} from '@/store/scheduleStore/schedule.domain';
import { foodStore } from '@/store/rootStore';
import { FoodWithQuantity } from '@/store/scheduleStore/schedule.domain.types';
import { Overlay } from '@/components/blocks/builders/food/shared/ContentInfo/Nutrients/Overlay';
import { generateHashFromIdCollection } from '@/lib/hash/hash';
import { comparer, toJS } from 'mobx';

type Props = {
  children: React.ReactNode;
  vm: {
    schedule: DayScheduleUI;
  };
};

const TotalNutrients = ({ vm }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [products, setProductsForNutrientCalculations] = useState<FoodWithQuantity[]>([]);

  const prevSignature = useRef<string | null>(null);

  const currentScheduleFoodIds = useLocalObservable(() => ({
    content: [] as number[],
    set(value: number[]) {
      if (!comparer.shallow(this.content, value)) {
        this.content = value;
      }
    },
  }));

  const onIntersection = async () => {
    const total = getTotalFoodAndDishFoodQuantityFromAll(vm.schedule.items);
    const ids = getAllFoodIds(total);

    currentScheduleFoodIds.set(ids);

    const [_, code] = await foodStore.loadFoodWithNutrientsByFoodIds(ids);

    const signature = makeScheduleItemsSignature(vm.schedule.items);
    if (code === 'PASS') {
      if (signature !== prevSignature.current) {
        console.log('Не равны, обновляю');
        setProductsForNutrientCalculations(total);
        prevSignature.current = signature;
        return;
      }

      console.log('Равны');
      console.log(prevSignature.current);
      console.log(signature);
    }

    if (code === 'DONE') {
      setProductsForNutrientCalculations(total);
      prevSignature.current = signature;
      return;
    }
    if (code === 'FAIL') {
      setProductsForNutrientCalculations([]);
      prevSignature.current = '';
      return;
    }
  };

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        onIntersection();
      },
      {
        threshold: 0.5,
      }
    );
    const el = containerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, []);

  const renderOverlay = useCallback(
    (value: string) => (
      <Overlay loading={foodStore.requestState} currentId={currentScheduleFoodIds}>
        {value}
      </Overlay>
    ),
    [foodStore.requestState, currentScheduleFoodIds]
  );

  const getFoodModel = useCallback(() => foodStore, []);
  return (
    <div className={styles.container} ref={containerRef}>
      <Nutrients currentFood={products} getFood={getFoodModel} renderOverlay={renderOverlay} />
    </div>
  );
};

export default observer(TotalNutrients);
