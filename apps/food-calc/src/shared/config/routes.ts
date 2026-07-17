// Route constants live below the router itself: `app/router.tsx` calls
// `createBrowserRouter([...])` at module scope, so importing a single path
// string from there dragged in the whole page graph and closed an import cycle
// through `app/` — which quietly re-executed module state (zustand stores) on
// every HMR update. Keep this file dependency-free.

export enum RouterLinks {
    Root = '/',
    Food = '/food',
    DishBuilder = '/dish',

    Dish = '/dish/:id',
    ScheduleBuilder = '/schedule',
    Analyses = '/analyses',
    Admin = '/admin',
    VerifyEmail = '/auth/verify-email',
}

export const RouterUrls = {
    Schedule: (id: string) => `/schedule/${id}`,
    getDish: (id: string) => `/dish/${id}`,
    getDishDraft: () => `/dish/draft`,
};
