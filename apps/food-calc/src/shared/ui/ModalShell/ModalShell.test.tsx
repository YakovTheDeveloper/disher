import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ModalShell } from './ModalShell';

describe('ModalShell.ActionButtons', () => {
  it('renders only the right (Confirm) slot when left is omitted', () => {
    const { container } = render(
      <ModalShell.ActionButtons right={<button>Готово</button>} />,
    );
    const bar = container.firstElementChild!;
    expect(bar.children).toHaveLength(1);
    expect(screen.getByText('Готово')).toBeInTheDocument();
  });

  it('renders both slots when a left contextual action is provided', () => {
    const { container } = render(
      <ModalShell.ActionButtons
        left={<button>+ деталь</button>}
        right={<button>Готово</button>}
      />,
    );
    const bar = container.firstElementChild!;
    expect(bar.children).toHaveLength(2);
    expect(screen.getByText('+ деталь')).toBeInTheDocument();
    expect(screen.getByText('Готово')).toBeInTheDocument();
  });
});
