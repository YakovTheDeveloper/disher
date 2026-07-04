import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeAll } from 'vitest';
import '@testing-library/jest-dom/vitest';
import Screen from './Screen';

// Screen монтирует useScrollBottomIndicator (IntersectionObserver), которого нет
// в jsdom — минимальный no-op мок, чтобы эффект не падал.
beforeAll(() => {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

// Инвариант верхнего ряда листа: `.topRow` рендерится ТОЛЬКО когда задан хотя бы
// один из слотов, и внутренний `.topContent`/`.topContentRight` — только когда
// задан соответствующий проп. Это защита от регрессии «topContent во всю ширину,
// когда правого слота нет» и от лишней разметки на страницах без слотов.
describe('Screen — topRow / topContent(Right) slot invariant', () => {
  const hasTopRow = (c: HTMLElement) => !!c.querySelector('[class*="topRow"]');

  it('без слотов — `.topRow` не рендерится', () => {
    const { container } = render(<Screen>контент</Screen>);
    expect(hasTopRow(container)).toBe(false);
    expect(screen.queryByTestId('tc')).toBeNull();
    expect(screen.queryByTestId('tcr')).toBeNull();
  });

  it('только topContent — ряд есть, левый слот есть, правого нет', () => {
    const { container } = render(
      <Screen topContent={<div data-testid="tc" />}>контент</Screen>
    );
    expect(hasTopRow(container)).toBe(true);
    expect(screen.getByTestId('tc')).toBeInTheDocument();
    expect(screen.queryByTestId('tcr')).toBeNull();
  });

  it('только topContentRight — ряд есть, правый слот есть, левого нет', () => {
    const { container } = render(
      <Screen topContentRight={<div data-testid="tcr" />}>контент</Screen>
    );
    expect(hasTopRow(container)).toBe(true);
    expect(screen.getByTestId('tcr')).toBeInTheDocument();
    expect(screen.queryByTestId('tc')).toBeNull();
  });

  it('оба слота — ряд с обоими', () => {
    render(
      <Screen
        topContent={<div data-testid="tc" />}
        topContentRight={<div data-testid="tcr" />}
      >
        контент
      </Screen>
    );
    expect(screen.getByTestId('tc')).toBeInTheDocument();
    expect(screen.getByTestId('tcr')).toBeInTheDocument();
  });
});
