import React, { Suspense, lazy } from 'react';
import { useDrawerStoreV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2';
import { ConfirmationPayload } from '@/drawers/confirmation/ConfirmationRemoveDishesDrawer.v2';

// Lazy imports for code splitting
const DateChoose = lazy(
  () =>
    import('@/components/features/builders/ScheduleBuilder/components/drawer/DateChoose/DateChoose')
);
const FoodAddDrawer = lazy(
  () => import('@/components/features/shared/drawers/FoodAddDrawer/FoodAddDrawer')
);
const ConfirmationRemoveDishesDrawerV2 = lazy(
  () => import('@/drawers/confirmation/ConfirmationRemoveDishesDrawer.v2')
);
const ConfirmationRemoveScheduleFoodDrawerV2 = lazy(
  () => import('@/drawers/confirmation/ConfirmationRemoveScheduleFoodDrawer.v2')
);
const ConfirmationRemoveScheduleEventsDrawerV2 = lazy(
  () => import('@/drawers/confirmation/ConfirmationRemoveScheduleEventsDrawer.v2')
);
const ConfirmationRemoveDishItemsDrawerV2 = lazy(
  () => import('@/drawers/confirmation/ConfirmationRemoveDishItemsDrawer.v2')
);
const ConfirmationRemoveDailyNormDrawerV2 = lazy(
  () => import('@/drawers/confirmation/ConfirmationRemoveDailyNormDrawer.v2')
);
const ConfirmationRemoveUserFoodDrawerV2 = lazy(
  () => import('@/drawers/confirmation/ConfirmationRemoveUserFoodDrawer.v2')
);

// Drawer type constants
export const DrawerTypesV2 = {
  Schedule: {
    DateChoose: 'schedule.date.v2',
  },
  Product: {
    Add: 'product.add.v2',
  },
  Dish: {
    Add: 'dish.add.v2',
  },
  Confirmation: {
    RemoveDishes: 'confirmation.remove.dishes.v2',
    RemoveScheduleFood: 'confirmation.remove.schedule.food.v2',
    RemoveScheduleEvents: 'confirmation.remove.schedule.events.v2',
    RemoveDishItems: 'confirmation.remove.dish.items.v2',
    RemoveDailyNorm: 'confirmation.remove.daily.norm.v2',
    RemoveUserFood: 'confirmation.remove.user.food.v2',
  },
} as const;

export const DrawerManagerV2: React.FC = () => {
  const { activeDrawer, isOpen, close } = useDrawerStoreV2();

  if (!isOpen || !activeDrawer) {
    return null;
  }

  const renderDrawer = () => {
    switch (activeDrawer.type) {
      case DrawerTypesV2.Schedule.DateChoose:
        return <DateChoose payload={activeDrawer.payload} onClose={close} />;
      case DrawerTypesV2.Product.Add:
        return <FoodAddDrawer payload={activeDrawer.payload} onClose={close} />;
      case DrawerTypesV2.Dish.Add:
        return <FoodAddDrawer payload={activeDrawer.payload} onClose={close} defaultTab="dish" />;
      case DrawerTypesV2.Confirmation.RemoveDishes:
        return (
          <ConfirmationRemoveDishesDrawerV2
            payload={activeDrawer.payload as ConfirmationPayload}
            onClose={close}
          />
        );
      case DrawerTypesV2.Confirmation.RemoveScheduleFood:
        return (
          <ConfirmationRemoveScheduleFoodDrawerV2
            payload={activeDrawer.payload as ConfirmationPayload}
            onClose={close}
          />
        );
      case DrawerTypesV2.Confirmation.RemoveScheduleEvents:
        return (
          <ConfirmationRemoveScheduleEventsDrawerV2
            payload={activeDrawer.payload as ConfirmationPayload}
            onClose={close}
          />
        );
      case DrawerTypesV2.Confirmation.RemoveDishItems:
        return (
          <ConfirmationRemoveDishItemsDrawerV2
            payload={activeDrawer.payload as ConfirmationPayload}
            onClose={close}
          />
        );
      case DrawerTypesV2.Confirmation.RemoveDailyNorm:
        return (
          <ConfirmationRemoveDailyNormDrawerV2
            payload={activeDrawer.payload as ConfirmationPayload}
            onClose={close}
          />
        );
      case DrawerTypesV2.Confirmation.RemoveUserFood:
        return (
          <ConfirmationRemoveUserFoodDrawerV2
            payload={activeDrawer.payload as ConfirmationPayload}
            onClose={close}
          />
        );
      default:
        console.warn(`Unknown drawer type: ${activeDrawer.type}`);
        return null;
    }
  };

  return <Suspense fallback={null}>{renderDrawer()}</Suspense>;
};

export default DrawerManagerV2;
