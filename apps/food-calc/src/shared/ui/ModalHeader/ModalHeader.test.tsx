import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ModalHeader } from './ModalHeader';

describe('ModalHeader', () => {
  it('renders the title as a heading', () => {
    render(<ModalHeader title="Добавить еду" onBack={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Добавить еду' })).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    render(<ModalHeader title="X" onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('uses a custom backLabel for accessibility', () => {
    render(<ModalHeader title="X" onBack={() => {}} backLabel="Закрыть" />);
    expect(screen.getByRole('button', { name: 'Закрыть' })).toBeInTheDocument();
  });

  it('renders the subtitle when provided', () => {
    render(<ModalHeader title="Разбор дня" subtitle="9 июня, понедельник" onBack={() => {}} />);
    expect(screen.getByText('9 июня, понедельник')).toBeInTheDocument();
  });

  it('omits the subtitle when not provided', () => {
    render(<ModalHeader title="Разбор дня" onBack={() => {}} />);
    expect(screen.queryByText('9 июня, понедельник')).not.toBeInTheDocument();
  });

  it('renders the trailing slot when provided', () => {
    render(
      <ModalHeader title="X" onBack={() => {}} trailing={<span data-testid="tr">i</span>} />,
    );
    expect(screen.getByTestId('tr')).toBeInTheDocument();
  });

  it('omits the trailing slot when not provided', () => {
    const { container } = render(<ModalHeader title="X" onBack={() => {}} />);
    // header has exactly two children: back button + title.
    expect(container.querySelector('header')!.children).toHaveLength(2);
  });
});
