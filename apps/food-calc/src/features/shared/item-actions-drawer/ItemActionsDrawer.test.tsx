import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// DrawerLayout wraps Base UI Drawer.Popup, which needs a Drawer.Root context.
// We only care about the action wiring, so stub the shell to a passthrough.
vi.mock('@/shared/ui/DrawerLayout', () => ({
  DrawerLayout: ({
    children,
    header,
    topRight,
  }: {
    children: React.ReactNode;
    header?: { kind: string; title?: React.ReactNode };
    topRight?: React.ReactNode;
  }) => (
    <div data-testid="drawer-layout">
      {header && header.kind !== 'custom' ? header.title : null}
      {topRight}
      {children}
    </div>
  ),
}));

import { ItemActionsDrawer } from './ItemActionsDrawer';

describe('ItemActionsDrawer', () => {
  it('renders the title, a bottom delete row and the page action in the header', () => {
    render(
      <ItemActionsDrawer
        onClose={vi.fn()}
        title="Молоко"
        onDelete={vi.fn()}
        pageAction={{ label: 'Информация о продукте', onClick: vi.fn() }}
      />,
    );

    expect(screen.getByText('Молоко')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Информация о продукте' })).toBeInTheDocument();
  });

  it('deleteLabel overrides the delete row caption (e.g. «Убрать из списка»)', () => {
    render(
      <ItemActionsDrawer onClose={vi.fn()} title="Молоко" onDelete={vi.fn()} deleteLabel="Убрать из списка" />,
    );

    expect(screen.getByRole('button', { name: 'Убрать из списка' })).toBeInTheDocument();
  });

  it('orphan row (no pageAction) renders title + delete only, zero other buttons', () => {
    render(<ItemActionsDrawer onClose={vi.fn()} title="Молоко" onDelete={vi.fn()} />);

    expect(screen.getByText('Молоко')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
    // delete is the only button — no info/edit actions
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('delete: closes the drawer FIRST, then calls onDelete exactly once', () => {
    const order: string[] = [];
    const onClose = vi.fn(() => order.push('close'));
    const onDelete = vi.fn(() => order.push('delete'));

    render(<ItemActionsDrawer onClose={onClose} title="X" onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['close', 'delete']); // onClose before navigate/delete — see spec Edge cases
  });

  it('editAction with htmlFor renders a <label for=…>, primes via onPointerDown, does NOT close', () => {
    // Label-делегация фокуса: onPointerDown только праймит (ДО click, см. SettingRow);
    // дровер закрывается по уходу фокуса наружу, а НЕ из клика (иначе label
    // размонтируется до делегирования).
    const onClose = vi.fn();
    const prime = vi.fn();

    render(
      <ItemActionsDrawer
        onClose={onClose}
        title="X"
        onDelete={vi.fn()}
        editActions={[{ label: 'Кол-во', htmlFor: 'qty-input', onClick: prime }]}
      />,
    );

    const label = screen.getByText('Кол-во').closest('label');
    expect(label).not.toBeNull();
    expect(label).toHaveAttribute('for', 'qty-input');

    fireEvent.pointerDown(label!);
    expect(prime).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('editAction without htmlFor stays a <button> that closes-then-runs', () => {
    const order: string[] = [];
    const onClose = vi.fn(() => order.push('close'));
    const run = vi.fn(() => order.push('run'));

    render(
      <ItemActionsDrawer
        onClose={onClose}
        title="X"
        onDelete={vi.fn()}
        editActions={[{ label: 'Время', onClick: run }]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Время' }));
    expect(order).toEqual(['close', 'run']);
  });

  it('pageAction: closes the drawer FIRST, then runs the action onClick', () => {
    const order: string[] = [];
    const onClose = vi.fn(() => order.push('close'));
    const infoClick = vi.fn(() => order.push('info'));

    render(
      <ItemActionsDrawer
        onClose={onClose}
        title="X"
        onDelete={vi.fn()}
        pageAction={{ label: 'Информация о продукте', onClick: infoClick }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Информация о продукте' }));

    expect(order).toEqual(['close', 'info']);
  });

  it('nutrientsAction: ряд «Нутриенты» перед правками, closes-then-runs', () => {
    const order: string[] = [];
    const onClose = vi.fn(() => order.push('close'));
    const peek = vi.fn(() => order.push('peek'));

    render(
      <ItemActionsDrawer
        onClose={onClose}
        title="Молоко"
        onDelete={vi.fn()}
        nutrientsAction={{ label: 'Нутриенты', onClick: peek }}
        editActions={[{ label: 'Время', onClick: vi.fn() }]}
      />,
    );

    const row = screen.getByRole('button', { name: 'Нутриенты' });
    // Ряд стоит РАНЬШЕ первого ряда правок в DOM.
    expect(row.compareDocumentPosition(screen.getByText('Время')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(row);
    expect(order).toEqual(['close', 'peek']);
  });
});
