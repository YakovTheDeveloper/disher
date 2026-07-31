// Route-chunk warm-up for view-transition navigations.
//
// Blink gives a view transition's DOM-update callback a 4s paused-rendering
// budget (view_transition.cc); a lazy route chunk that suspends INSIDE that
// callback on a slow network blows the budget and the navigation is aborted
// («Transition was aborted because of timeout in DOM update»). Best practice
// (web.dev): do network fetches BEFORE startViewTransition, while the page is
// still interactive. We can't fetch in RR's callback, so screens with a
// page-link (quick-view drawers) warm the target chunk as soon as they open —
// by tap time the module is cached and the VT commit never suspends.
//
// Registry lives in shared so app/router.tsx (app layer) can register loaders
// while features (FSD-ниже) only call preloadRoute — no upward imports.

type Loader = () => Promise<unknown>;

const loaders = new Map<string, Loader>();

/** Called by app/router.tsx next to each lazy() route. Prefix matches `to`. */
export function registerRoutePreload(pathPrefix: string, loader: Loader): void {
  loaders.set(pathPrefix, loader);
}

/** Fire-and-forget warm-up of the chunk that serves `to`. No-op if unknown. */
export function preloadRoute(to: string): void {
  for (const [prefix, loader] of loaders) {
    if (to === prefix || to.startsWith(prefix + '/')) {
      void loader();
      return;
    }
  }
}
