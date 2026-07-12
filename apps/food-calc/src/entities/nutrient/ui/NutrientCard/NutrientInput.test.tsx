import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import NutrientInput from './NutrientInput';

describe('NutrientInput', () => {
  it('renders input with value and unit', () => {
    render(<NutrientInput value={25} onChange={() => {}} unit="г" />);

    const input = screen.getByDisplayValue('25');
    expect(input).toBeInTheDocument();
    expect(screen.getByText('г')).toBeInTheDocument();
  });

  it('never renders a daily-norm hint (composition authoring shows value + unit only)', () => {
    render(<NutrientInput value={25} onChange={() => {}} unit="мг" />);

    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
    expect(screen.getByText('мг')).toBeInTheDocument();
  });
});
