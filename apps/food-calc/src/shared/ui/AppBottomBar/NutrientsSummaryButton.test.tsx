import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import NutrientsSummaryButton from './NutrientsSummaryButton';
import type { NutrientTotals } from '@/shared/lib/nutrients';

const noop = () => {};

describe('NutrientsSummaryButton', () => {
  it("renders rounded macros line as 'protein/fat/carbs/fiber' from ids 1/2/3/6", () => {
    const totals: NutrientTotals = { '1': 12.7, '2': 8.3, '3': 24, '6': 5.2, '7': 1850 };
    render(<NutrientsSummaryButton totals={totals} onClick={noop} />);
    expect(screen.getByText('13/8/24/5')).toBeInTheDocument();
  });

  it("renders kcal line from id 7", () => {
    const totals: NutrientTotals = { '7': 1849.6 };
    render(<NutrientsSummaryButton totals={totals} onClick={noop} />);
    expect(screen.getByText('1850 ккал')).toBeInTheDocument();
  });

  it("substitutes '—' for missing nutrient ids", () => {
    render(<NutrientsSummaryButton totals={{}} onClick={noop} />);
    expect(screen.getByText('—/—/—/—')).toBeInTheDocument();
    expect(screen.getByText('— ккал')).toBeInTheDocument();
  });

  it("renders 0 (not '—') when nutrient is explicitly zero", () => {
    const totals: NutrientTotals = { '1': 0, '2': 0, '3': 0, '6': 0, '7': 0 };
    render(<NutrientsSummaryButton totals={totals} onClick={noop} />);
    expect(screen.getByText('0/0/0/0')).toBeInTheDocument();
    expect(screen.getByText('0 ккал')).toBeInTheDocument();
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    render(<NutrientsSummaryButton totals={{}} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: /открыть нутриенты/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
