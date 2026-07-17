import type { NavigateOptions } from 'react-router';

// Socket for the router: `shared` must not import `app/router`, because that
// module runs `createBrowserRouter([...])` at module scope and would close an
// import cycle back through the whole page graph (a cycle Vite resolves by
// silently re-executing module state on HMR — see shared/config/routes.ts).
// `app/index.tsx` plugs the real router in at boot; the arrow points down.

type Navigate = (to: string, options?: NavigateOptions) => void;

let navigate: Navigate | null = null;

export function setNavigator(fn: Navigate): void {
    navigate = fn;
}

export function navigateTo(to: string, options?: NavigateOptions): void {
    // Before boot plugs the router in there is nothing to navigate with. Callers
    // are user-driven (toast actions), so this can only be hit in tests.
    navigate?.(to, options);
}
