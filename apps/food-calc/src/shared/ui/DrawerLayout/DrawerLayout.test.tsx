// @vitest-environment jsdom
// DrawerLayout — hideTopChrome prop.
// По умолчанию рендерит 40px drag-handle с Drawer.Close (крестик) + topRight
// слотом. Когда hideTopChrome=true (NutrientsDrawer case), эта строка
// удаляется целиком — ряд занимал место, который заголовок drawer'а должен
// был занимать сам. Swipe-to-close через edgeHandle и backdrop остаются.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import DrawerLayout from './DrawerLayout';

// Mutable so a single test can flip to a side drawer (where the edge handle
// renders). Defaults to 'bottom' so the existing chrome tests are unaffected.
const sideMock = vi.hoisted(() => ({ side: 'bottom' as 'bottom' | 'left' | 'right' }));

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
    // Close теперь отдаёт каркас через Base UI `render`-проп (IconButton).
    // Мок чтит и render-элемент (новый путь), и legacy children.
    Close: ({ children, render, ...rest }: { children: React.ReactNode; render?: React.ReactNode }) =>
      render ? (
        <span data-testid="close-button">{render}</span>
      ) : (
        <button data-testid="close-button" {...rest}>{children}</button>
      ),
  },
}));
vi.mock('@/shared/assets/icons/cross.svg?react', () => ({
  default: () => <svg data-testid="cross-icon" />,
}));
vi.mock('@/shared/assets/icons/arrowLeftLong.svg?react', () => ({
  default: () => <svg data-testid="arrow-left-icon" />,
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_: string, fallback?: string) => fallback ?? '' }),
}));
vi.mock('./drawerSide', () => ({
  useDrawerSide: () => ({ side: sideMock.side, width: undefined }),
}));

describe('DrawerLayout — hideTopChrome', () => {
  afterEach(() => {
    sideMock.side = 'bottom';
  });

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

  // Contextual leading control: when `onBack` is provided the top-left button
  // becomes a back arrow that calls onBack instead of rendering Drawer.Close —
  // so a back arrow and a close cross never sit side by side (sub-screen case).
  it('renders a contextual back button (not Close) when onBack is provided', () => {
    const onBack = vi.fn();
    const { queryByTestId, getByRole } = render(
      <DrawerLayout onBack={onBack} backLabel="Назад к норме">
        body
      </DrawerLayout>,
    );
    expect(queryByTestId('close-button')).toBeNull();
    expect(queryByTestId('cross-icon')).toBeNull();
    const back = getByRole('button', { name: 'Назад к норме' });
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  // Side drawers render the edge swipe-handle. Its `--sys-field-*` tone now comes
  // from the unconditional `:root` publication in ModalShell.module.scss — the
  // old `data-modal-fields='mono'` republisher attribute was removed 2026-06-22
  // (it was a no-op single-position gate). The handle is still rendered (the
  // `dl-edgeHandle` class via the SCSS-module mock).
  it('side drawer renders the edge swipe-handle', () => {
    sideMock.side = 'left';
    const { container } = render(<DrawerLayout>body</DrawerLayout>);
    const handle = container.querySelector('.dl-edgeHandle');
    expect(handle).not.toBeNull();
  });

  it('bottom drawer has no edge handle', () => {
    const { container } = render(<DrawerLayout>body</DrawerLayout>);
    expect(container.querySelector('.dl-edgeHandle')).toBeNull();
  });
});
