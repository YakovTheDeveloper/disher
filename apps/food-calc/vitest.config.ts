import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
    test: {
        silent: false,
        onConsoleLog(log: string, _type: 'stdout' | 'stderr'): boolean | void {
            // i18next prints a Locize ad on every init, and vitest.setup.ts inits
            // i18n once per test FILE — 161 identical banners to read a failure
            // through. Nothing asserts on it.
            if (log.includes('locize.com')) return false;
            console.log(log);
            return true
        },
        globals: true,  // For using global variables like `describe`, `it`, etc.
        environment: 'jsdom',  // Ensures the right test environment (JS DOM for React)
        setupFiles: ['./vitest.setup.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
        // Vitest defaults to one worker per core, and every worker builds its own
        // jsdom — on a 4-core box that was ~4 DOMs at once and the run died with
        // «FATAL ERROR: AlignedAlloc Allocation failed - process out of memory»
        // before reporting a single result. Halving it fits the suite in memory.
        // A fraction rather than a number so it also scales down: a 2-core CI
        // runner gets 1 worker instead of inheriting a value tuned for this laptop.
        // (Raising --max-old-space-size makes it WORSE — it lets each worker grow.)
        maxWorkers: '50%',
    },
}))