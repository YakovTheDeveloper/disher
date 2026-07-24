import type { Preview } from '@storybook/react-vite';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/app/i18n';

// Self-hosted webfonts (Onest/Ubuntu Mono) — same import the app boots with, so
// the drawer renders with production type, not a fallback.
import '../src/app/fonts';
// Global design tokens: mixin → palette → tokens → themes → dark layer, plus the
// `:root` resets. Without this the drawer paints unstyled and story.to.design
// would import garbage instead of the real surface-1 sheet.
import '../src/shared/assets/style/index.scss';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
  },
  // i18n is global — every drawer string (Close/expand labels, etc.) resolves
  // through the real instance. The docked-drawer provider stack is story-local
  // (see QuickViewDrawer.stories) since only that slice needs Base UI's drawer
  // context + a router.
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
};

export default preview;
