import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import TimePicker from './TimePicker';

describe('TimePicker', () => {
  let hours = '';
  let minutes = '';
  let rerender: (ui: React.ReactElement) => void;

  const mockSetHours = vi.fn((val: string) => {
    hours = val;
  });

  const mockSetMinutes = vi.fn((val: string) => {
    minutes = val;
  });

  const defaultProps = {
    hours,
    minutes,
    setHours: mockSetHours,
    setMinutes: mockSetMinutes,
    onChange: vi.fn(),
    onFinish: vi.fn(),
  };

  beforeEach(() => {
    hours = '';
    minutes = '';
    vi.clearAllMocks();
  });

  it('stays on hours input after entering one digit', async () => {
    const user = userEvent.setup();
    const local = render(<TimePicker {...defaultProps} />);
    rerender = local.rerender;

    const hoursInput = screen.getByLabelText('Hour');
    await user.click(hoursInput);
    expect(hoursInput).toHaveFocus();
    await user.type(hoursInput, '1');
    expect(defaultProps.setHours).toHaveBeenCalledWith('1');
  });

  it('jumps to minutes input after entering two digits in hours', async () => {
    const user = userEvent.setup();
    const local = render(<TimePicker {...defaultProps} />);
    rerender = local.rerender;

    const hoursInput = screen.getByLabelText('Hour');
    const minutesInput = screen.getByLabelText('Minute');

    await user.click(hoursInput);
    await user.type(hoursInput, '12');

    expect(defaultProps.setHours).toHaveBeenLastCalledWith('12');
    await waitFor(() => expect(minutesInput).toHaveFocus());
  });

  it('stays on minutes input after entering one digit', async () => {
    const user = userEvent.setup();
    const local = render(<TimePicker {...defaultProps} />);
    rerender = local.rerender;

    const minutesInput = screen.getByLabelText('Minute');
    await user.click(minutesInput);
    await user.type(minutesInput, '3');

    expect(minutesInput).toHaveFocus();
    expect(defaultProps.setMinutes).toHaveBeenCalledWith('3');
  });

  it('blurs minutes input after entering two digits', async () => {
    const user = userEvent.setup();
    const local = render(<TimePicker {...defaultProps} />);
    rerender = local.rerender;

    const minutesInput = screen.getByLabelText('Minute');
    await user.click(minutesInput);
    await user.type(minutesInput, '45');

    expect(minutesInput).not.toHaveFocus();
    expect(defaultProps.setMinutes).toHaveBeenCalledWith('45');
    expect(defaultProps.onFinish).toHaveBeenCalledWith('00:45');
  });
});
