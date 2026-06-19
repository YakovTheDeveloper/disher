// @vitest-environment jsdom
// Resolve-contract for the «Уточнения» drawer. The whole "пусто = пропуск, не
// отмена" semantics in DishBuilderPage hinge on this split:
//   • «Предложить» → resolves the comment STRING (incl. '' for "proceed без
//     уточнения") — caller проверяет `=== undefined`, so '' must proceed.
//   • cancel / swipe-dismiss → Base UI resolves `undefined` (DrawerManager
//     contract, covered in DrawerManager.integration.test) — caller bails out.
//
// Base UI Drawer parts are mocked as passthroughs (their useTransitionStatus +
// scroll-lock don't survive jsdom); we exercise store behaviour, not animation.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, fireEvent, waitFor } from '@testing-library/react';
import DrawerManager from '@/app/ui/DrawerManager';
import { drawerStore } from '@/shared/ui/drawer-store';
import { SuggestIngredientsClarifyDrawer } from './SuggestIngredientsClarifyDrawer';

vi.mock('@base-ui/react/drawer', () => {
  const Passthrough = ({
    children,
  }: { children?: React.ReactNode } & Record<string, unknown>) => <div>{children}</div>;
  return {
    Drawer: {
      Root: Passthrough,
      Portal: Passthrough,
      Backdrop: Passthrough,
      Viewport: Passthrough,
      Popup: Passthrough,
      Content: Passthrough,
      Close: Passthrough,
      Title: Passthrough,
    },
  };
});
vi.mock('@/shared/ui/Drawer/Drawer.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `dr-${String(p)}` }),
}));

const tick = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

beforeEach(() => {
  drawerStore.reset();
  if (!document.getElementById('drawer-root')) {
    const root = document.createElement('div');
    root.id = 'drawer-root';
    document.body.appendChild(root);
  }
});

describe('SuggestIngredientsClarifyDrawer — resolve contract', () => {
  it('«Предложить» with text → resolves the typed comment', async () => {
    const { findByPlaceholderText, findByRole } = render(<DrawerManager />);

    let resolved: unknown = 'PENDING';
    await act(async () => {
      void drawerStore.show(SuggestIngredientsClarifyDrawer, {}).then((r) => {
        resolved = r;
      });
      await tick();
    });

    const field = await findByPlaceholderText(/Что уточнить/);
    fireEvent.change(field, { target: { value: 'вегетарианский' } });
    const btn = await findByRole('button', { name: 'Предложить' });
    await act(async () => {
      fireEvent.click(btn);
      await tick();
    });

    await waitFor(() => expect(resolved).toBe('вегетарианский'));
  });

  it('«Предложить» with empty field → resolves "" (a deliberate skip, NOT a cancel)', async () => {
    const { findByRole } = render(<DrawerManager />);

    let resolved: unknown = 'PENDING';
    await act(async () => {
      void drawerStore.show(SuggestIngredientsClarifyDrawer, {}).then((r) => {
        resolved = r;
      });
      await tick();
    });

    const btn = await findByRole('button', { name: 'Предложить' });
    await act(async () => {
      fireEvent.click(btn);
      await tick();
    });

    // '' !== undefined → DishBuilderPage proceeds with no clarification.
    await waitFor(() => expect(resolved).toBe(''));
  });
});
