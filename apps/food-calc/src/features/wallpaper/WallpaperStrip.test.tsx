// WallpaperStrip — shared thumbnail rail with two layouts. Semantics under test:
// `layout="columns"` (settings) chunks thumbs into columns of 2 (Embla slider),
// while the default `row` (long-press popover) is a flat single row. The store,
// catalog and Embla hook are stubbed; the scss module returns class names verbatim
// so the column structure is queryable.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const WALLPAPERS = [
  { id: 'a', src: '/a.jpg', label: 'A' },
  { id: 'b', src: '/b.jpg', label: 'B' },
  { id: 'c', src: '/c.jpg', label: 'C' },
  { id: 'd', src: '/d.jpg', label: 'D' },
];
const WALLPAPER_SCREENS = [{ key: 'ration', label: 'Рацион' }];
const setWallpaper = vi.fn();
const store = { selection: { ration: 'b' } as Record<string, string>, setWallpaper };

vi.mock('@/shared/lib/wallpaper', () => ({
  WALLPAPERS,
  WALLPAPER_SCREENS,
  useWallpaperStore: (sel: (s: typeof store) => unknown) => sel(store),
}));

// Embla hook: callback-ref + no api → the rAF reInit effect early-returns.
vi.mock('embla-carousel-react', () => ({ default: () => [vi.fn(), undefined] }));

vi.mock('./WallpaperStrip.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => String(p) }),
}));

const { WallpaperStrip } = await import('./WallpaperStrip');

describe('WallpaperStrip', () => {
  it('columns: chunks all thumbs into columns of 2', () => {
    const { container } = render(<WallpaperStrip screen="ration" layout="columns" />);

    const columns = container.querySelectorAll('.column');
    expect(columns).toHaveLength(2); // 4 wallpapers / 2
    columns.forEach((col) => {
      expect(col.querySelectorAll('[role="radio"]')).toHaveLength(2);
    });
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('row (default): flat strip, no column wrappers', () => {
    const { container } = render(<WallpaperStrip screen="ration" />);

    expect(container.querySelectorAll('.column')).toHaveLength(0);
    expect(container.querySelector('.strip')).not.toBeNull();
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('marks the stored selection as checked', () => {
    render(<WallpaperStrip screen="ration" layout="columns" />);
    expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
  });
});
