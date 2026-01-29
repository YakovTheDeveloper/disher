import { RootInstance } from "@/store/types";
import { types, Instance, getRoot } from "mobx-state-tree";
import {
    Drawers,
    DrawerPayloadModel,
    DrawerType,
} from "./payloadModels";

export const ScheduleDrawers = {
    DateChoose: 'schedule.date',
} as const;

export const ProductDrawers = {
    Add: 'product.add',
} as const;

export const DishDrawers = {
    Add: 'dish.add',
} as const;

export const ConfirmationDrawers = {
    RemoveDishes: 'confirmation.remove.dishes',
    RemoveScheduleFood: 'confirmation.remove.schedule.food',
    RemoveScheduleEvents: 'confirmation.remove.schedule.events',
    RemoveDishItems: 'confirmation.remove.dish.items',
    RemoveDailyNorm: 'confirmation.remove.daily.norm',
    RemoveUserFood: 'confirmation.remove.user.food',
} as const;

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
            } else {
                // Clear all drawer-related params
                url.searchParams.delete('drawer');
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
                        self.activeDrawer = Drawers.models.DateChoose.create(args);
                        break;
                    case ProductDrawers.Add:
                        self.activeDrawer = Drawers.models.ProductAdd.create(args);
                        break;
                    case DishDrawers.Add:
                        self.activeDrawer = Drawers.models.DishAdd.create(args);
                        break;
                    case ConfirmationDrawers.RemoveDishes:
                        self.activeDrawer = Drawers.models.ConfirmationRemoveDishes.create(args);
                        break;
                    case ConfirmationDrawers.RemoveScheduleFood:
                        self.activeDrawer = Drawers.models.ConfirmationRemoveScheduleFood.create(args);
                        break;
                    case ConfirmationDrawers.RemoveScheduleEvents:
                        self.activeDrawer = Drawers.models.ConfirmationRemoveScheduleEvents.create(args);
                        break;
                    case ConfirmationDrawers.RemoveDishItems:
                        self.activeDrawer = Drawers.models.ConfirmationRemoveDishItems.create(args);
                        break;
                    case ConfirmationDrawers.RemoveDailyNorm:
                        self.activeDrawer = Drawers.models.ConfirmationRemoveDailyNorm.create(args);
                        break;
                    case ConfirmationDrawers.RemoveUserFood:
                        self.activeDrawer = Drawers.models.ConfirmationRemoveUserFood.create(args);
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
                    case ProductDrawers.Add:
                    case DishDrawers.Add:
                    case ConfirmationDrawers.RemoveDishes:
                    case ConfirmationDrawers.RemoveScheduleFood:
                    case ConfirmationDrawers.RemoveScheduleEvents:
                    case ConfirmationDrawers.RemoveDishItems:
                    case ConfirmationDrawers.RemoveDailyNorm:
                    case ConfirmationDrawers.RemoveUserFood:
                        return true;

                    default:
                        return false;
                }
            },

            syncFromUrl() {
                const params = new URLSearchParams(window.location.search);
                const type = params.get('drawer') as DrawerType | null;
                console.log("drawerArgs", type);

                if (type) {
                    let drawerArgs: DrawerOpenArgs | null = null;

                    switch (type) {
                        case ScheduleDrawers.DateChoose:
                            drawerArgs = { type };
                            break;
                        case ProductDrawers.Add:
                            drawerArgs = { type };
                            break;
                        case DishDrawers.Add:
                            drawerArgs = { type };
                            break;
                        case ConfirmationDrawers.RemoveDishes:
                            drawerArgs = { type };
                            break;
                        case ConfirmationDrawers.RemoveScheduleFood:
                            drawerArgs = { type };
                            break;
                        case ConfirmationDrawers.RemoveScheduleEvents:
                            drawerArgs = { type };
                            break;
                        case ConfirmationDrawers.RemoveDishItems:
                            drawerArgs = { type };
                            break;
                        case ConfirmationDrawers.RemoveDailyNorm:
                            drawerArgs = { type };
                            break;
                        case ConfirmationDrawers.RemoveUserFood:
                            drawerArgs = { type };
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
                } else if (self.isOpen) {
                    this.close(true);
                }
            },
        };
    });

export type DrawerStoreInstance = Instance<typeof DrawerStore>;