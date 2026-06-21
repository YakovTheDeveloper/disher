import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import FieldLabel from './FieldLabel';

describe('FieldLabel', () => {
  // Контракт, ради которого FieldLabel остался отдельным примитивом: с htmlFor он
  // обязан рендерить <label for>, связанный с инпутом (клик по метке → фокус,
  // скринридер). Вид делегирован в <Text> через ...rest-spread — этот тест ловит,
  // если htmlFor перестанет доходить до тега.
  it('renders a <label> tied to the input when htmlFor is given', () => {
    render(
      <>
        <FieldLabel htmlFor="qty">Количество</FieldLabel>
        <input id="qty" />
      </>,
    );
    expect(screen.getByLabelText('Количество')).toBe(document.getElementById('qty'));
  });

  it('renders a non-label <span> for a section title (no htmlFor)', () => {
    render(<FieldLabel>Гипотезы</FieldLabel>);
    const el = screen.getByText('Гипотезы');
    expect(el.tagName).toBe('SPAN');
    expect(el).not.toHaveAttribute('for');
  });

  it('appends the optional hint suffix', () => {
    render(<FieldLabel hint="· необязательно">Заметка</FieldLabel>);
    expect(screen.getByText(/необязательно/)).toBeInTheDocument();
  });
});
