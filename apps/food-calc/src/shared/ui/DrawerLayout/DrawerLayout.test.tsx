// @vitest-environment jsdom
// DrawerLayout — hideTopChrome prop.
// По умолчанию рендерит 40px drag-handle с Drawer.Close (крестик) + topRight
// слотом. Когда hideTopChrome=true (NutrientsDrawer case), эта строка
// удаляется целиком — ряд занимал место, который заголовок drawer'а должен
// был занимать сам. Swipe-to-close через edgeHandle и backdrop остаются.
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import DrawerLayout from './DrawerLayout';

vi.mock('./DrawerLayout.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `dl-${String(p)}` }),
}));
vi.mock('@base-ui/react/drawer', () => ({
  Drawer: {
    Popup: ({ children, ...rest }: { children: React.ReactNode }) => (
      <div data-testid="popup" {...rest}>{children}</div>
    ),
    Title: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    Content: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="content">{children}</div>
    ),
    Close: ({ children, ...rest }: { children: React.ReactNode }) => (
      <button data-testid="close-button" {...rest}>{children}</button>
    ),
  },
}));
vi.mock('@/shared/assets/icons/cross.svg?react', () => ({
  default: () => <svg data-testid="cross-icon" />,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_: string, fallback?: string) => fallback ?? '' }),
}));
vi.mock('./drawerSide', () => ({
  useDrawerSide: () => ({ side: 'bottom', width: undefined }),
}));

describe('DrawerLayout — hideTopChrome', () => {
  it('renders the Close button by default', () => {
    const { queryByTestId } = render(<DrawerLayout>body</DrawerLayout>);
    expect(queryByTestId('close-button')).not.toBeNull();
    expect(queryByTestId('cross-icon')).not.toBeNull();
  });

  it('omits the entire top chrome row when hideTopChrome=true', () => {
    const { queryByTestId } = render(<DrawerLayout hideTopChrome>body</DrawerLayout>);
    expect(queryByTestId('close-button')).toBeNull();
    expect(queryByTestId('cross-icon')).toBeNull();
  });

  it('still renders the scrollable body in both modes', () => {
    const { queryByTestId, rerender } = render(<DrawerLayout>body</DrawerLayout>);
    expect(queryByTestId('content')).not.toBeNull();
    rerender(<DrawerLayout hideTopChrome>body</DrawerLayout>);
    expect(queryByTestId('content')).not.toBeNull();
  });
});
