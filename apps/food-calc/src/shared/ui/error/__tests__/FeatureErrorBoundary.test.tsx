import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Deterministic refId + no Sentry/console pipeline.
vi.mock('@/shared/lib/errors/report', () => ({
  reportError: vi.fn(() => ({ kind: { kind: 'unknown', message: '', raw: null }, refId: 'abc12345' })),
}));

import { reportError } from '@/shared/lib/errors/report';
import { FeatureErrorBoundary } from '../FeatureErrorBoundary';

// A child that throws while a shared flag says so. Toggling the flag + a retry
// (which re-keys the subtree) lets it recover.
const boom = { throw: true };
function Bomb() {
  if (boom.throw) throw new Error('kaboom');
  return <div>живой контент</div>;
}

beforeEach(() => {
  boom.throw = true;
  vi.mocked(reportError).mockClear();
  // React logs a caught render error to console.error — silence to keep output clean.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FeatureErrorBoundary', () => {
  it('renders a labeled fallback + refId and reports through the shared pipeline', () => {
    render(
      <FeatureErrorBoundary label="Разбор">
        <Bomb />
      </FeatureErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Что-то сломалось в разделе «Разбор»');
    expect(screen.getByText(/код: abc12345/)).toBeInTheDocument();
    expect(reportError).toHaveBeenCalledWith('render', expect.any(Error));
  });

  it('recovers after «Попробовать снова» once the child stops throwing', () => {
    render(
      <FeatureErrorBoundary label="Разбор">
        <Bomb />
      </FeatureErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    boom.throw = false; // the transient cause is gone
    fireEvent.click(screen.getByRole('button', { name: 'Попробовать снова' }));

    expect(screen.getByText('живой контент')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('falls back to the generic message when no label is given', () => {
    render(
      <FeatureErrorBoundary>
        <Bomb />
      </FeatureErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Что-то сломалось в этом разделе');
  });
});
