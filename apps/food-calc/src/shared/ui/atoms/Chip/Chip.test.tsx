// Chip — презентационная кнопка-чип. Тест проверяет контракт: type-дефолт,
// проброс onClick / onMouseDown / className и переключение active-класса.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { MouseEvent } from 'react';

// CSS-модули резолвятся в хешированные имена — мокаем на стабильные токены,
// чтобы class-merge для active/className можно было ассертить по имени.
vi.mock('./Chip.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => String(p) }),
}));

const { Chip } = await import('./Chip');

describe('Chip', () => {
  it('renders its children', () => {
    render(<Chip>Боль</Chip>);
    expect(screen.getByRole('button', { name: 'Боль' })).toBeInTheDocument();
  });

  it('defaults to type="button" so it never submits a surrounding form', () => {
    render(<Chip>Тег</Chip>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('fires onClick when tapped', () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Энергия</Chip>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('adds the active class only when active', () => {
    const { rerender } = render(<Chip>Стресс</Chip>);
    const idle = screen.getByRole('button').className.split(' ');
    rerender(<Chip active>Стресс</Chip>);
    const active = screen.getByRole('button').className.split(' ');
    expect(idle).not.toContain('active');
    expect(active).toContain('active');
  });

  it('defaults to host surface 0 (light pill) + raised elevation — no modifier classes', () => {
    render(<Chip>Цинк</Chip>);
    const cls = screen.getByRole('button').className.split(' ');
    expect(cls).not.toContain('onSheet');
    expect(cls).not.toContain('flat');
  });

  it('lifts the pill to white (onSheet) on a light host, surface={1}', () => {
    render(<Chip onSurface={1}>Цинк</Chip>);
    const cls = screen.getByRole('button').className.split(' ');
    expect(cls).toContain('onSheet');
    expect(cls).not.toContain('flat');
  });

  it('surface={2} stays onSheet — rest shadow now rides the base, not a class', () => {
    render(<Chip onSurface={2}>Цинк</Chip>);
    const cls = screen.getByRole('button').className.split(' ');
    expect(cls).toContain('onSheet');
    expect(cls).not.toContain('flat');
  });

  it('adds the flat class for the dense (bordered, no-shadow) elevation skin', () => {
    render(<Chip elevation="flat">Цинк</Chip>);
    const cls = screen.getByRole('button').className.split(' ');
    expect(cls).toContain('flat');
  });

  it('merges a caller-supplied className', () => {
    render(<Chip className="scaleChip">Сон</Chip>);
    expect(screen.getByRole('button')).toHaveClass('scaleChip');
  });

  it('forwards onMouseDown so callers can keep the keyboard up via preventDefault', () => {
    // RelationAtomInput/TagAtomInput/ScaleAtomInput rely on this: the chip must
    // let the tap's mousedown be preventDefault-ed, otherwise the focused input
    // blurs and the mobile keyboard collapses mid-tap.
    const onMouseDown = vi.fn((e: MouseEvent<HTMLButtonElement>) => e.preventDefault());
    render(<Chip onMouseDown={onMouseDown}>Тревога</Chip>);
    // fireEvent returns false when the event was cancelled (preventDefault'd).
    const notCancelled = fireEvent.mouseDown(screen.getByRole('button'));
    expect(onMouseDown).toHaveBeenCalledOnce();
    expect(notCancelled).toBe(false);
  });
});
