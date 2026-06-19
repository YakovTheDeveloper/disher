// QuietActionButton — тихая текст-кнопка-примитив. Тест проверяет контракт:
// label как accessible-имя, type="button", проброс onClick, и опциональный
// ведомый шеврон (chevron) — affordance «это действие / откроет шаг».
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// CSS-модуль резолвится в хешированные имена — мокаем на стабильные токены,
// чтобы наличие .chevron можно было ассертить по имени класса.
vi.mock('./QuietActionButton.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => String(p) }),
}));

const { QuietActionButton } = await import('./QuietActionButton');

const icon = <svg data-testid="lead-icon" />;

describe('QuietActionButton', () => {
  it('uses the label as the accessible name and defaults to type="button"', () => {
    render(<QuietActionButton label="Предложить" icon={icon} />);
    expect(screen.getByRole('button', { name: 'Предложить' })).toHaveAttribute('type', 'button');
  });

  it('renders no trailing chevron by default', () => {
    const { container } = render(<QuietActionButton label="Норма" icon={icon} />);
    expect(container.querySelector('.chevron')).toBeNull();
  });

  it('renders a trailing chevron when chevron is set (affordance «это действие»)', () => {
    const { container } = render(<QuietActionButton label="Норма" icon={icon} chevron />);
    expect(container.querySelector('.chevron')).not.toBeNull();
    // Шеврон aria-hidden — не пачкает accessible-имя кнопки (оно = label).
    expect(screen.getByRole('button', { name: 'Норма' })).toBeInTheDocument();
  });

  it('fires onClick when tapped', () => {
    const onClick = vi.fn();
    render(<QuietActionButton label="Открыть" icon={icon} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
