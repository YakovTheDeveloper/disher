import React, { Suspense, lazy } from 'react';
import { useModalsAndDrawers } from '@/components/features/shared/hooks/useModalsAndDrawers';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { observer } from 'mobx-react-lite';
import { DrawerLayout } from '@/components/features/builders/shared/components/DrawerLayout';
import { ConfirmationPayload } from '@/components/ui/Drawer/DrawerConfirmation/DrawerConfirmation';

const DateChoose = lazy(
  () =>
    import('@/components/features/builders/ScheduleBuilder/components/drawer/DateChoose/DateChoose')
);
const FoodAddDrawer = lazy(
  () => import('@/components/features/shared/drawers/FoodAddDrawer/FoodAddDrawer')
);

const ConfirmationDrawer = lazy(
  () => import('@/components/ui/Drawer/DrawerConfirmation/DrawerConfirmation')
);

const DrawerChooseDailyNorm = lazy(
  () =>
    import(
      '@/components/features/builders/shared/drawers/DrawerChooseDailyNorm/DrawerChooseDailyNorm'
    )
);

export const DrawerManagerV2: React.FC = () => {
  const { drawerStore } = useModalsAndDrawers();
  const { activeDrawer, isOpen, close } = drawerStore;

  if (!isOpen || !activeDrawer) {
    return null;
  }
  const renderDrawer = () => {
    switch (activeDrawer.type) {
      case DrawerTypesV2.Schedule.DateChoose:
        return (
          <DrawerLayout>
            <DateChoose onClose={close} />
          </DrawerLayout>
        );
      case DrawerTypesV2.Product.Add:
        return (
          <DrawerLayout>{<FoodAddDrawer onClose={close} defaultTab="product" />}</DrawerLayout>
        );
      case DrawerTypesV2.Dish.Add:
        return <DrawerLayout>{<FoodAddDrawer onClose={close} defaultTab="dish" />}</DrawerLayout>;
      case DrawerTypesV2.Confirmation.RemoveDishes:
      case DrawerTypesV2.Confirmation.RemoveScheduleFood:
      case DrawerTypesV2.Confirmation.RemoveScheduleEvents:
      case DrawerTypesV2.Confirmation.RemoveDishItems:
      case DrawerTypesV2.Confirmation.RemoveDailyNorms:
      case DrawerTypesV2.Confirmation.RemoveUserFood:
        return (
          <DrawerLayout>
            <ConfirmationDrawer
              payload={activeDrawer.payload as ConfirmationPayload | undefined}
              drawerType={activeDrawer.type}
              onClose={close}
            />
          </DrawerLayout>
        );
      case DrawerTypesV2.DailyNorm.Choose:
        return <DrawerLayout>{<DrawerChooseDailyNorm onClose={close} />}</DrawerLayout>;
      default:
        console.warn(`Unknown drawer type: ${activeDrawer.type}`);
        return null;
    }
  };

  return <Suspense fallback={null}>{renderDrawer()}</Suspense>;
};

export default observer(DrawerManagerV2);
