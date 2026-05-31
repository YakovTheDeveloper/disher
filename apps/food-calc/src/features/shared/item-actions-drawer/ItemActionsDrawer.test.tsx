import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// DrawerLayout wraps Base UI Drawer.Popup, which needs a Drawer.Root context.
// We only care about the action wiring, so stub the shell to a passthrough.
vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({ children, topRight }: { children: React.ReactNode; topRight?: React.ReactNode }) => (
    <div data-testid="drawer-layout">
      {topRight}
      {children}
    </div>
  ),
}));

import { ItemActionsDrawer } from './ItemActionsDrawer';

describe('ItemActionsDrawer', () => {
  it('renders the title, a top-right delete and each action button', () => {
    render(
      <ItemActionsDrawer
        onClose={vi.fn()}
        title="Молоко"
        onDelete={vi.fn()}
        actions={[{ label: 'Информация о продукте', onClick: vi.fn() }]}
      />,
    );

    expect(screen.getByText('Молоко')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Информация о продукте' })).toBeInTheDocument();
  });

  it('orphan row (actions=[]) renders title + delete only, zero action buttons', () => {
    render(<ItemActionsDrawer onClose={vi.fn()} title="Молоко" onDelete={vi.fn()} actions={[]} />);

    expect(screen.getByText('Молоко')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
    // delete is the only button — no info/edit actions
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('delete: closes the drawer FIRST, then calls onDelete exactly once', () => {
    const order: string[] = [];
    const onClose = vi.fn(() => order.push('close'));
    const onDelete = vi.fn(() => order.push('delete'));

    render(<ItemActionsDrawer onClose={onClose} title="X" onDelete={onDelete} actions={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['close', 'delete']); // onClose before navigate/delete — see spec Edge cases
  });

  it('action: closes the drawer FIRST, then runs the action onClick', () => {
    const order: string[] = [];
    const onClose = vi.fn(() => order.push('close'));
    const infoClick = vi.fn(() => order.push('info'));

    render(
      <ItemActionsDrawer
        onClose={onClose}
        title="X"
        onDelete={vi.fn()}
        actions={[{ label: 'Информация о продукте', onClick: infoClick }]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Информация о продукте' }));

    expect(order).toEqual(['close', 'info']);
  });
});
