import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
    test: {
        silent: false,
        onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
            console.log(log);
            return true
        },
        globals: true,  // For using global variables like `describe`, `it`, etc.
        environment: 'jsdom',  // Ensures the right test environment (JS DOM for React)
    },
}))