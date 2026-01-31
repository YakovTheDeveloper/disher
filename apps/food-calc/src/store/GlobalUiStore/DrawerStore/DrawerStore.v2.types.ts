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
    DailyNorm: {
        Choose: 'daily.norm.choose.v2',
    },
    Confirmation: {
        RemoveDishes: 'confirmation.remove.dishes.v2',
        RemoveDishItems: 'confirmation.remove.dish.items.v2',
        RemoveScheduleFood: 'confirmation.remove.schedule.food.v2',
        RemoveScheduleEvents: 'confirmation.remove.schedule.events.v2',
        RemoveDailyNorms: 'confirmation.remove.daily.norms.v2',
        RemoveUserFood: 'confirmation.remove.user.food.v2',
    },
} as const;

export interface DrawerProps<TPayload = unknown> {
    payload: TPayload;
    onClose: () => void;
}

export type LazyDrawerComponent<TPayload = unknown> = React.ComponentType<DrawerProps<TPayload>>;

export interface DrawerConfig<TPayload = unknown> {
    component: LazyDrawerComponent<TPayload>;
    payloadSchema?: unknown;
}

export interface DrawerRegistryEntry<TPayload = unknown> {
    loader: () => Promise<{ default: LazyDrawerComponent<TPayload> }>;
    config?: DrawerConfig<TPayload>;
}

export interface ActiveDrawerState {
    type: string;
    payload?: unknown;
}

export type DrawerOpenArgs<TPayload = unknown> = {
    type: string;
    payload?: TPayload;
};