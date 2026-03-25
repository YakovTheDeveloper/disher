import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import NutrientCardV3 from './NutrientCardV3';
import type { Nutrient } from '@/entities/nutrient/ui/NutrientGroup/constants';

const protein: Nutrient = {
  id: '1',
  name: 'protein',
  displayName: 'Protein',
  displayNameRu: 'Белки',
  unit: 'g',
  unitRu: 'г',
  symbol: 'PRO',
  group: 'main',
};

// defaultDailyNorms[1] = 51, so 25.5g → 50%
const getValue = (id: string) => (id === '1' ? 25.5 : 0);

describe('NutrientCardV3', () => {
  it('renders label, value, and percent by default', () => {
    render(<NutrientCardV3 content={protein} getValue={getValue} />);

    expect(screen.getByText('Белки')).toBeInTheDocument();
    expect(screen.getByText('25.5 г')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders percent when no children are provided', () => {
    render(<NutrientCardV3 content={protein} getValue={getValue} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders children instead of percent when children are provided', () => {
    render(
      <NutrientCardV3 content={protein} getValue={getValue}>
        <span data-testid="custom-slot">Custom</span>
      </NutrientCardV3>
    );

    expect(screen.getByTestId('custom-slot')).toBeInTheDocument();
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('hides value when showValue=false', () => {
    render(<NutrientCardV3 content={protein} getValue={getValue} showValue={false} />);

    expect(screen.getByText('Белки')).toBeInTheDocument();
    expect(screen.queryByText('25.5 г')).not.toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('applies dimmed class when dimmed=true', () => {
    const { container } = render(
      <NutrientCardV3 content={protein} getValue={getValue} dimmed />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/dimmed/);
  });

  it('does not apply dimmed class when dimmed=false', () => {
    const { container } = render(
      <NutrientCardV3 content={protein} getValue={getValue} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toMatch(/dimmed/);
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <NutrientCardV3 content={protein} getValue={getValue} onClick={handleClick} />
    );

    fireEvent.click(container.firstChild as HTMLElement);
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('applies custom className', () => {
    const { container } = render(
      <NutrientCardV3 content={protein} getValue={getValue} className="my-custom" />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/my-custom/);
  });

  it('uses default getValue (returns 0) when not provided', () => {
    render(<NutrientCardV3 content={protein} />);

    expect(screen.getByText('0.0 г')).toBeInTheDocument();
    // getRoundedPercent(0) → "0.0" (falls into < 10 branch)
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('applies group class for styling', () => {
    const { container } = render(
      <NutrientCardV3 content={protein} getValue={getValue} />
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/main/);
  });
});
