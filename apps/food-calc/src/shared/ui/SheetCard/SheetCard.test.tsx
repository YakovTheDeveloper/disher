import { createRef } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { SheetCard } from './SheetCard';

describe('SheetCard', () => {
  beforeEach(() => {
    // Дефолт варианта читается из localStorage (dv:Predlozhka) — чистим, чтобы
    // тест видел именно дефолт примитива.
    localStorage.clear();
  });
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

  it('defaults to the pearl gloss variant on the shared Predlozhka anchor', () => {
    render(<SheetCard data-testid="sheet">x</SheetCard>);
    const root = screen.getByTestId('sheet');
    expect(root).toHaveAttribute('data-dv', 'Predlozhka');
    expect(root).toHaveAttribute('data-dv-v', 'pearl');
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

  it('forwards the ref to the root element (merged with the variant anchor)', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <SheetCard ref={ref} data-testid="sheet">
        x
      </SheetCard>,
    );
    expect(ref.current).toBe(screen.getByTestId('sheet'));
  });
});
