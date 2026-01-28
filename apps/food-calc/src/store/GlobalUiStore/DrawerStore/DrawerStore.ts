import { RootInstance } from "@/store/types";
import { types, Instance, getRoot } from "mobx-state-tree";

// Payload models for ScheduleDrawers
const DateChooseDrawer = types.model('DateChooseDrawer', {
    type: types.literal('schedule.date'),
});

// Payload models for ProductDrawers
const ProductAddDrawer = types.model('ProductAddDrawer', {
    type: types.literal('product.add'),
});

// Payload models for DishDrawers
const DishAddDrawer = types.model('DishAddDrawer', {
    type: types.literal('dish.add'),
});

// Union of all drawer payload models
const DrawerPayloadModel = types.union(
    DateChooseDrawer,
    ProductAddDrawer,
    DishAddDrawer,
);

export const ScheduleDrawers = {
    DateChoose: 'schedule.date',
} as const;

export const ProductDrawers = {
    Add: 'product.add',
} as const;

export const DishDrawers = {
    Add: 'dish.add',
} as const;

export type DrawerType = typeof ScheduleDrawers[keyof typeof ScheduleDrawers] | typeof DishDrawers[keyof typeof DishDrawers] | typeof ProductDrawers[keyof typeof ProductDrawers];

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
                        self.activeDrawer = DateChooseDrawer.create(args);
                        break;
                    case ProductDrawers.Add:
                        self.activeDrawer = ProductAddDrawer.create(args);
                        break;
                    case DishDrawers.Add:
                        self.activeDrawer = DishAddDrawer.create(args);
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
