import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../SettingRow.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `sr-${String(p)}` }),
}));

const { SettingRow } = await import('../SettingRow');

describe('SettingRow', () => {
  it('renders label and sub', () => {
    render(<SettingRow label="Тема" sub="подпись" />);
    expect(screen.getByText('Тема')).toBeInTheDocument();
    expect(screen.getByText('подпись')).toBeInTheDocument();
  });

  it('is a <button> and fires onClick when onClick is provided', () => {
    const onClick = vi.fn();
    render(<SettingRow label="Действие" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Действие' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders a non-button container when onClick is omitted', () => {
    render(<SettingRow label="Статичный ряд" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Статичный ряд')).toBeInTheDocument();
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(<SettingRow label="Недоступно" onClick={onClick} disabled />);
    const btn = screen.getByRole('button', { name: 'Недоступно' });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
