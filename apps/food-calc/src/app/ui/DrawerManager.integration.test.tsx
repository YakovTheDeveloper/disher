// @vitest-environment jsdom
// DrawerManager integration: drawerStore.show(C, {}, { side: 'left' }) физически
// доходит до drawer content через DrawerSideProvider. До 2026-05-21 проверялся
// только shape вызова мока в AccountPanel.test — runtime-контракт «side
// действительно попадает в context» не покрыт.
//
// Base UI Drawer мочим passthrough'ами: их внутренний useTransitionStatus +
// scroll-lock плохо живут в jsdom, а проверяем здесь поведение store'а, не
// анимации Base UI.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import DrawerManager from './DrawerManager';
import { drawerStore } from '@/shared/ui/drawer-store';
import { useDrawerSide } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';

vi.mock('@base-ui/react/drawer', () => {
  const Passthrough = ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
    // swipeDirection / open / onOpenChange и т.п. прокидываем как data-*, чтобы
    // тест мог проверить, что DrawerManager корректно их вычислил.
    <div data-open={String(rest.open)} data-swipe-direction={String(rest.swipeDirection)}>
      {children}
    </div>
  );
  return {
    Drawer: {
      Root: Passthrough,
      Portal: Passthrough,
      Backdrop: Passthrough,
      Viewport: Passthrough,
    },
  };
});
vi.mock('@/shared/ui/Drawer/Drawer.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `dr-${String(p)}` }),
}));

type TestDrawerProps = BaseDrawerProps<unknown> & { marker: string };

const TestDrawer = ({ marker }: TestDrawerProps) => {
  const { side, width } = useDrawerSide();
  return (
    <div data-testid={`test-drawer-${marker}`} data-side={side} data-width={String(width)} />
  );
};

beforeEach(() => {
  drawerStore.reset();
  // DrawerManager пытается найти #drawer-root в document — на jsdom его нет
  // по умолчанию, добавляем.
  if (!document.getElementById('drawer-root')) {
    const root = document.createElement('div');
    root.id = 'drawer-root';
    document.body.appendChild(root);
  }
});

describe('DrawerManager integration — side:left ends up in DrawerSideContext', () => {
  it('side:left → useDrawerSide() returns {side:"left"} inside the rendered drawer', async () => {
    const { findByTestId } = render(<DrawerManager />);

    await act(async () => {
      void drawerStore.show(TestDrawer, { marker: 'A' }, { side: 'left' });
      // Phase 'mounting' → 'open' переключается на rAF. Подождём один tick.
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    });

    const el = await findByTestId('test-drawer-A');
    expect(el.getAttribute('data-side')).toBe('left');
  });

  it('default (no options) → side:"bottom" — backward-compat', async () => {
    const { findByTestId } = render(<DrawerManager />);

    await act(async () => {
      void drawerStore.show(TestDrawer, { marker: 'B' });
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    });

    const el = await findByTestId('test-drawer-B');
    expect(el.getAttribute('data-side')).toBe('bottom');
  });

  it('side:left → DrawerManager passes swipeDirection="left" to Drawer.Root', async () => {
    const { container } = render(<DrawerManager />);

    await act(async () => {
      void drawerStore.show(TestDrawer, { marker: 'C' }, { side: 'left' });
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    });

    // Контракт: DrawerManager.tsx:29 — `swipeDirection={options.side === 'bottom' ? 'down' : options.side}`.
    // Для side:'left' это должен быть 'left' (для 'bottom' → 'down').
    await waitFor(() => {
      const root = container.querySelector('[data-swipe-direction]');
      expect(root?.getAttribute('data-swipe-direction')).toBe('left');
    });
  });

  it('close(id) removes the instance — sanity', async () => {
    const { queryByTestId } = render(<DrawerManager />);

    let resolvedWith: unknown = 'NOT_RESOLVED';
    await act(async () => {
      drawerStore
        .show(TestDrawer, { marker: 'D' }, { side: 'left' })
        .then((r) => {
          resolvedWith = r;
        });
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    });

    expect(queryByTestId('test-drawer-D')).not.toBeNull();

    await act(async () => {
      drawerStore.closeLast('result-value');
      // closeLast → close → phase:'closing'; реальный finishClose дёргает Base UI
      // onOpenChangeComplete. В passthrough-моке этого callback нет, так что
      // напрямую руками сбрасываем store через reset, имитируя finishClose.
      drawerStore.reset();
    });

    expect(queryByTestId('test-drawer-D')).toBeNull();
    // closeLast разрешает промис до reset; result доходит.
    expect(resolvedWith).toBe('result-value');
  });
});
