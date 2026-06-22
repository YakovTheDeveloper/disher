import { createRef } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { SheetCard } from './SheetCard';

describe('SheetCard', () => {
  afterEach(cleanup);

  it('renders header, content and actions slots', () => {
    render(
      <SheetCard header="Наблюдения" actions={<button type="button">Добавить</button>}>
        <p>тело</p>
      </SheetCard>,
    );
    expect(screen.getByRole('heading', { name: 'Наблюдения' })).toBeInTheDocument();
    expect(screen.getByText('тело')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить' })).toBeInTheDocument();
  });

  it('omits header and actions when not provided', () => {
    render(
      <SheetCard data-testid="sheet">
        <p>тело</p>
      </SheetCard>,
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('тело')).toBeInTheDocument();
  });

  it('carries no design-variant scaffolding (pearl tone baked 2026-06-22)', () => {
    render(<SheetCard data-testid="sheet">x</SheetCard>);
    const root = screen.getByTestId('sheet');
    expect(root).not.toHaveAttribute('data-dv');
    expect(root).not.toHaveAttribute('data-dv-v');
  });

  it('forwards arbitrary props (data-*, handlers) onto the root', () => {
    render(
      <SheetCard data-testid="sheet" data-write-food-anchor="" data-state="ready">
        x
      </SheetCard>,
    );
    const root = screen.getByTestId('sheet');
    expect(root).toHaveAttribute('data-write-food-anchor', '');
    expect(root).toHaveAttribute('data-state', 'ready');
  });

  it('forwards the ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <SheetCard ref={ref} data-testid="sheet">
        x
      </SheetCard>,
    );
    expect(ref.current).toBe(screen.getByTestId('sheet'));
  });
});
