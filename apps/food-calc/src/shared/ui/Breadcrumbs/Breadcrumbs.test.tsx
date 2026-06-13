import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import Breadcrumbs from './Breadcrumbs';

type Step = 'search' | 'time' | 'quantity' | 'details';
const STEPS: Step[] = ['search', 'time', 'quantity', 'details'];
const LABELS: Record<Step, string> = {
  search: 'Еда',
  time: 'Время',
  quantity: 'Порция',
  details: 'Особенности',
};

describe('Breadcrumbs — компактный трейл результатов', () => {
  it('shows only visited steps in the trail', () => {
    render(
      <Breadcrumbs
        steps={STEPS}
        current="quantity"
        stepLabels={LABELS}
        stepResults={{ search: 'Курица', time: '08:30', quantity: 150 }}
        visitedSteps={['search', 'time', 'quantity']}
        onStepClick={() => {}}
      />,
    );
    // details is not visited → no crumb for it
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByText('Курица')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.queryByText('Особенности')).not.toBeInTheDocument();
  });

  it('falls back to the step label when a visited step has no result', () => {
    render(
      <Breadcrumbs
        steps={STEPS}
        current="details"
        stepLabels={LABELS}
        stepResults={{ search: 'Курица' }}
        visitedSteps={['search', 'details']}
        onStepClick={() => {}}
      />,
    );
    expect(screen.getByText('Курица')).toBeInTheDocument();
    // details visited but no result → shows the label, not hidden
    expect(screen.getByText('Особенности')).toBeInTheDocument();
  });

  it('truncates a long result to 13 characters + ellipsis', () => {
    render(
      <Breadcrumbs
        steps={['search']}
        current="search"
        stepLabels={{ search: 'Еда' }}
        stepResults={{ search: 'Куриная грудка отварная' }}
        visitedSteps={['search']}
        onStepClick={() => {}}
      />,
    );
    expect(screen.getByRole('button').textContent).toBe('Куриная грудк…');
  });

  it('truncates by code points — does not split an emoji surrogate pair', () => {
    render(
      <Breadcrumbs
        steps={['search']}
        current="search"
        stepLabels={{ search: 'Еда' }}
        stepResults={{ search: '😀'.repeat(20) }}
        visitedSteps={['search']}
        onStepClick={() => {}}
      />,
    );
    expect(screen.getByRole('button').textContent).toBe(`${'😀'.repeat(13)}…`);
  });

  it('keeps the current step in the trail and marks it aria-current', () => {
    render(
      <Breadcrumbs
        steps={STEPS}
        current="quantity"
        stepLabels={LABELS}
        stepResults={{ search: 'Курица', time: '08:30', quantity: 150 }}
        visitedSteps={['search', 'time', 'quantity']}
        onStepClick={() => {}}
      />,
    );
    expect(screen.getByText('150')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Курица')).not.toHaveAttribute('aria-current');
  });

  it('calls onStepClick with the step name when a crumb is clicked', () => {
    const onStepClick = vi.fn();
    render(
      <Breadcrumbs
        steps={STEPS}
        current="quantity"
        stepLabels={LABELS}
        stepResults={{ search: 'Курица', time: '08:30', quantity: 150 }}
        visitedSteps={['search', 'time', 'quantity']}
        onStepClick={onStepClick}
      />,
    );
    fireEvent.click(screen.getByText('Курица'));
    expect(onStepClick).toHaveBeenCalledWith('search');
  });
});
