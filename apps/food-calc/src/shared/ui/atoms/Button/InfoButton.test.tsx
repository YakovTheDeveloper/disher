import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import InfoButton from './InfoButton';

// Обёртка над IconButton: инъектит ⓘ-глиф + дефолтную a11y-метку «Информация».
// Тесты стерегут контракт метки (дефолт vs override) и проброс тона/htmlFor —
// это то, на что опираются page-слоты Анализов (ghost) и FoodActionCard (className).
describe('InfoButton', () => {
  it('дефолтный aria-label = «Информация»', () => {
    render(<InfoButton />);
    expect(screen.getByLabelText('Информация')).toBeInTheDocument();
  });

  it('aria-label переопределяется', () => {
    render(<InfoButton aria-label="Что такое инсайты" />);
    expect(screen.getByLabelText('Что такое инсайты')).toBeInTheDocument();
    expect(screen.queryByLabelText('Информация')).toBeNull();
  });

  it('рендерит ⓘ-глиф (svg)', () => {
    const { container } = render(<InfoButton />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('прокидывает tone="ghost" в IconButton', () => {
    render(<InfoButton tone="ghost" aria-label="i" />);
    expect(screen.getByLabelText('i').className).toContain('ghost');
  });

  it('прокидывает htmlFor → рендер как <label>', () => {
    render(<InfoButton aria-label="i" htmlFor="target" />);
    const el = screen.getByLabelText('i');
    expect(el.tagName).toBe('LABEL');
    expect(el).toHaveAttribute('for', 'target');
  });
});
