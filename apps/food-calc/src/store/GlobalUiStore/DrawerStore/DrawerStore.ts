import { RootInstance } from "@/store/types";
import { types, Instance, getRoot } from "mobx-state-tree";

// Payload models for ScheduleDrawers
const DateChooseDrawer = types.model('DateChooseDrawer', {
    type: types.literal('schedule.date'),
});

const FoodAddDrawer = types.model('FoodAddDrawer', {
    type: types.literal('schedule.food.add'),
});

export const FoodEditDrawer = types.model('FoodEditDrawer', {
    type: types.literal('schedule.food.edit'),
    payload: types.model({
        defaultTab: types.enumeration(['foodChange', 'time', 'quantity']),
        itemToEditId: types.string
    }),
});

const EventAddDrawer = types.model('EventAddDrawer', {
    type: types.literal('schedule.event.add'),
});

export const EventEditDrawer = types.model('EventEditDrawer', {
    type: types.literal('schedule.event.edit'),
    payload: types.model({
        defaultTab: types.enumeration(['content', 'time', 'value']),
        itemToEditId: types.string
    }),
});

// Payload models for DishDrawers
const DishFoodAdd = types.model('DishFoodAdd', {
    type: types.literal('dish.food.add'),
});

export const DishFoodEdit = types.model('DishFoodEdit', {
    type: types.literal('dish.food.edit'),
    payload: types.model({
        defaultTab: types.enumeration(['content', 'quantity']),
        itemToEditId: types.string
    }),
});

// Union of all drawer payload models
const DrawerPayloadModel = types.union(
    DateChooseDrawer,
    FoodAddDrawer,
    FoodEditDrawer,
    EventAddDrawer,
    EventEditDrawer,
    DishFoodAdd,
    DishFoodEdit,

);

export const ScheduleDrawers = {
    DateChoose: 'schedule.date',
    FoodEdit: 'schedule.food.edit',
    FoodAdd: 'schedule.food.add',
    EventEdit: 'schedule.event.edit',
    EventAdd: 'schedule.event.add',
} as const;

export const DishDrawers = {
    FoodAdd: 'dish.food.add',
    FoodEdit: 'dish.food.edit',
} as const;

export type DrawerType = typeof ScheduleDrawers[keyof typeof ScheduleDrawers] | typeof DishDrawers[keyof typeof DishDrawers];

export type DrawerOpenArgs = Instance<typeof DrawerPayloadModel>;

export const DrawerStore = types
    .model('DrawerStore', {
        activeDrawer: types.maybe(DrawerPayloadModel),
        isOpen: types.optional(types.boolean, false),
    })
    .views(self => ({
        get isDrawerOpen() {
            return self.isOpen;
        },

        get currentDrawer() {
            return self.activeDrawer;
        },
    }))
    .actions(self => {
        function updateUrl(args: DrawerOpenArgs | null) {
            const url = new URL(window.location.href);
            if (args) {
                url.searchParams.set('drawer', args.type);

                // Serialize payload fields if they exist
                if ('payload' in args && args.payload) {
                    if ('itemToEditId' in args.payload) {
                        url.searchParams.set('itemId', args.payload.itemToEditId);
                    }
                    if ('defaultTab' in args.payload) {
                        url.searchParams.set('defaultTab', args.payload.defaultTab);
                    }
                }
            } else {
                // Clear all drawer-related params
                url.searchParams.delete('drawer');
                url.searchParams.delete('itemId');
                url.searchParams.delete('defaultTab');
            }

            const newUrl = url.pathname + url.search + url.hash;
            if (window.location.search !== url.search) {
                window.history.pushState({ drawerSync: true }, '', newUrl);
            }
        }

        return {
            open(args: DrawerOpenArgs, skipUrlUpdate = false) {
                switch (args.type) {
                    case ScheduleDrawers.DateChoose:
                        self.activeDrawer = DateChooseDrawer.create(args);
                        break;
                    case ScheduleDrawers.FoodAdd:
                        self.activeDrawer = FoodAddDrawer.create(args);
                        break;
                    case ScheduleDrawers.FoodEdit:
                        self.activeDrawer = FoodEditDrawer.create(args);
                        break;
                    case ScheduleDrawers.EventAdd:
                        self.activeDrawer = EventAddDrawer.create(args);
                        break;
                    case ScheduleDrawers.EventEdit:
                        self.activeDrawer = EventEditDrawer.create(args);
                        break;
                    case DishDrawers.FoodAdd:
                        self.activeDrawer = DishFoodAdd.create(args);
                        break;
                    case DishDrawers.FoodEdit:
                        self.activeDrawer = DishFoodEdit.create(args);
                        break;
                }
                self.isOpen = true;
                if (!skipUrlUpdate) {
                    updateUrl(args);
                }
            },

            close(skipUrlUpdate = false) {
                self.isOpen = false;
                self.activeDrawer = undefined;
                if (!skipUrlUpdate) {
                    updateUrl(null);
                }
            },

            canOpenDrawer(args: DrawerOpenArgs): boolean {
                switch (args.type) {
                    case ScheduleDrawers.DateChoose:
                        return true;

                    case ScheduleDrawers.FoodAdd:
                    case ScheduleDrawers.EventAdd: {
                        return true
                    }

                    case ScheduleDrawers.FoodEdit: {
                        return true
                    }

                    case ScheduleDrawers.EventEdit: {
                        return true
                    }

                    case DishDrawers.FoodAdd: {
                        return true
                    }

                    case DishDrawers.FoodEdit: {
                        return true
                    }

                    default:
                        return false;
                }
            },

            syncFromUrl() {
                const params = new URLSearchParams(window.location.search);
                const type = params.get('drawer') as DrawerType | null;
                console.log("drawerArgs", type);

                if (type) {
                    try {
                        const itemId = params.get('itemId');
                        const defaultTab = params.get('defaultTab');
                        let drawerArgs: DrawerOpenArgs | null = null;

                        switch (type) {
                            case ScheduleDrawers.DateChoose:
                                drawerArgs = { type };
                                break;
                            case ScheduleDrawers.FoodAdd:
                                drawerArgs = { type };
                                break;
                            case ScheduleDrawers.FoodEdit:
                                if (!itemId || !defaultTab) {
                                    throw new Error('Missing required payload fields for FoodEdit');
                                }
                                drawerArgs = {
                                    type,
                                    payload: { itemToEditId: itemId, defaultTab: defaultTab as 'foodChange' | 'time' | 'quantity' }
                                };
                                break;
                            case ScheduleDrawers.EventAdd:
                                drawerArgs = { type };
                                break;
                            case ScheduleDrawers.EventEdit:
                                if (!itemId || !defaultTab) {
                                    throw new Error('Missing required payload fields for EventEdit');
                                }
                                drawerArgs = {
                                    type,
                                    payload: { itemToEditId: itemId, defaultTab: defaultTab as 'content' | 'time' | 'value' }
                                };
                                break;
                            case DishDrawers.FoodAdd:
                                drawerArgs = { type };
                                break;
                            case DishDrawers.FoodEdit:
                                if (!itemId || !defaultTab) {
                                    throw new Error('Missing required payload fields for DishFoodEdit');
                                }
                                drawerArgs = {
                                    type,
                                    payload: { itemToEditId: itemId, defaultTab: defaultTab as 'content' | 'quantity' }
                                };
                                break;
                            default:
                                throw new Error(`Unknown drawer type: ${type}`);
                        }

                        console.log("drawerArgs", drawerArgs);

                        if (drawerArgs && this.canOpenDrawer(drawerArgs)) {
                            this.open(drawerArgs, true);
                        } else {
                            console.log("can't open drawer");
                            this.close(true);
                        }
                    } catch (e) {
                        console.error('Failed to parse drawer payload from URL', e);
                        this.close(true);
                    }
                } else if (self.isOpen) {
                    this.close(true);
                }
            },
        };
    });

export type DrawerStoreInstance = Instance<typeof DrawerStore>;
