import { resolve } from 'node:path';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

// Storybook host for the design-playground stories (story.to.design pipeline).
// Scope is intentionally NARROW — only the QuickViewDrawer slice — so the build
// stays fast and the plugin imports exactly the one surface we want to redesign.
//
// Storybook's react-vite builder auto-loads the app's `vite.config.ts`, so the
// full prod pipeline (svgr `?react`, CSS-modules `generateScopedName`, sass,
// path aliases) already applies — the drawer renders with production fidelity.
// viteFinal only re-declares the `@/…` aliases as a harmless safety net in case
// that auto-merge ever changes. Package is ESM (`"type":"module"`) ⇒ no
// `__dirname`; `process.cwd()` is the package dir when Storybook runs.
const root = process.cwd();

const config: StorybookConfig = {
  stories: ['../src/features/food/quick-view-drawer/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  // Public assets (any `url(/…)` referenced from the token stylesheets) resolve
  // the same way the app serves them.
  staticDirs: ['../public'],
  viteFinal: async (cfg) =>
    mergeConfig(cfg, {
      resolve: {
        alias: {
          '@icons': resolve(root, 'src/shared/assets/icons'),
          '@': resolve(root, 'src'),
        },
      },
    }),
};

export default config;
