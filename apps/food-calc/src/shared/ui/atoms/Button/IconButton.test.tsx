import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IconButton } from './IconButton';

const glyph = <svg data-testid="glyph" />;

// Контракт примитива: элемент-тип (button vs label), тон-класс, size, и главное —
// iOS-safe label-делегация (htmlFor → <label for>, НЕ <button>). Регресс на
// <button> тихо убил бы rename/модалки на iOS (feedback_ios_focus), а тайпчек его
// не ловит — это единственный страж. Классы CSS-модуля матчим подстрокой.
describe('IconButton — element type (iOS-safe label delegation)', () => {
  it('без htmlFor рендерится как <button type="button">', () => {
    render(<IconButton icon={glyph} aria-label="Действие" />);
    const el = screen.getByLabelText('Действие');
    expect(el.tagName).toBe('BUTTON');
    expect(el).toHaveAttribute('type', 'button');
  });

  it('с htmlFor рендерится как <label for>, НЕ <button> (регресс-страж iOS)', () => {
    render(<IconButton icon={glyph} aria-label="Изменить название" htmlFor="rename-input" />);
    const el = screen.getByLabelText('Изменить название');
    expect(el.tagName).toBe('LABEL');
    expect(el).toHaveAttribute('for', 'rename-input');
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('IconButton — tone class', () => {
  it('ghost → холодный глиф без подложки (класс ghost)', () => {
    render(<IconButton icon={glyph} aria-label="i" tone="ghost" />);
    expect(screen.getByLabelText('i').className).toContain('ghost');
  });

  it('neutral → класс neutral', () => {
    render(<IconButton icon={glyph} aria-label="i" tone="neutral" />);
    expect(screen.getByLabelText('i').className).toContain('neutral');
  });

  it('без тона — голый shell (ни ghost, ни neutral, ни danger)', () => {
    render(<IconButton icon={glyph} aria-label="i" />);
    const c = screen.getByLabelText('i').className;
    expect(c).not.toContain('ghost');
    expect(c).not.toContain('neutral');
    expect(c).not.toContain('danger');
  });
});

describe('IconButton — size + disabled', () => {
  it('size прокидывается в inline width/height', () => {
    render(<IconButton icon={glyph} aria-label="i" size={40} />);
    expect(screen.getByLabelText('i')).toHaveStyle({ width: '40px', height: '40px' });
  });

  it('disabled выставляет атрибут на button', () => {
    render(<IconButton icon={glyph} aria-label="i" disabled />);
    expect(screen.getByLabelText('i')).toBeDisabled();
  });

  it('в label-режиме disabled НЕ протекает на <label> (невалидный no-op), for остаётся', () => {
    // D4: `disabled` деструктурирован и в `...props` не попадает — на <label>
    // атрибут не садится, но делегация (for) сохраняется.
    render(
      <IconButton icon={glyph} aria-label="i" htmlFor="target" disabled />
    );
    const el = screen.getByLabelText('i');
    expect(el.tagName).toBe('LABEL');
    expect(el).not.toHaveAttribute('disabled');
    expect(el).toHaveAttribute('for', 'target');
  });
});
