import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IdeaCard from './IdeaCard';

describe('IdeaCard (display-only)', () => {
  it('renders title and body without a «+ в гипотезы» action', () => {
    render(<IdeaCard idea={{ title: 'Меньше кофе', body: 'Проверить неделю' }} />);

    expect(screen.getByText('Меньше кофе')).toBeInTheDocument();
    expect(screen.getByText('Проверить неделю')).toBeInTheDocument();
    // The convert-to-hypothesis action was removed — ideas are read-only now.
    expect(screen.queryByRole('button', { name: /в гипотезы/ })).toBeNull();
    expect(screen.queryByText(/\+ в гипотезы/)).toBeNull();
  });
});
