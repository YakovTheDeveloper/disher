import { type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import BackButton from './BackButton';

// BackButton calls useViewTransitionState (a data-router hook) unconditionally —
// even in the onClick variant (`to` is '' there) — so it needs a real data
// router context, not just a plain <Router>.
function renderInRouter(ui: ReactNode) {
  const router = createMemoryRouter([{ path: '/', element: <>{ui}</> }]);
  return render(<RouterProvider router={router} />);
}

describe('BackButton — onClick (overlay) variant', () => {
  it('runs onClick on press instead of navigating', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderInRouter(<BackButton onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Назад' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('exposes a custom ariaLabel when provided', () => {
    renderInRouter(<BackButton onClick={() => {}} ariaLabel="Закрыть поиск" />);

    expect(screen.getByRole('button', { name: 'Закрыть поиск' })).toBeInTheDocument();
  });
});
