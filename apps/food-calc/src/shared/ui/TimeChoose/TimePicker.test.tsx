import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import TimePicker from './TimeChoose';

// Controlled React inputs with maxLength cause issues with userEvent.type
// (selection replace via onFocus is unreliable in jsdom).
// fireEvent.change goes straight to the onChange handler — correct for unit tests.
const changeInput = (input: HTMLElement, value: string) =>
  fireEvent.change(input, { target: { value } });

function renderPicker(initialTime = '00:00', onFinish = vi.fn()) {
  render(<TimePicker initialTime={initialTime} onFinish={onFinish} />);
  return {
    hoursInput: screen.getByLabelText('Hour'),
    minutesInput: screen.getByLabelText('Minute'),
    onFinish,
  };
}

// ─── focus flow ──────────────────────────────────────────────────────────────

describe('TimePicker — focus flow', () => {
  it('jumps to minutes after two digits in hours', async () => {
    const { hoursInput, minutesInput } = renderPicker();

    changeInput(hoursInput, '12');

    await waitFor(() => expect(minutesInput).toHaveFocus());
  });

  it('blurs minutes input after two digits in minutes', async () => {
    const { hoursInput, minutesInput } = renderPicker();

    changeInput(hoursInput, '12');
    await waitFor(() => expect(minutesInput).toHaveFocus());

    changeInput(minutesInput, '30');
    await waitFor(() => expect(minutesInput).not.toHaveFocus());
  });

  it('auto-advances when first digit in hours is >= 3', async () => {
    const { hoursInput, minutesInput } = renderPicker();

    changeInput(hoursInput, '5');

    await waitFor(() => expect(minutesInput).toHaveFocus());
    expect(hoursInput).toHaveValue('05');
  });

  it('does NOT auto-advance when first digit is 0, 1, or 2', () => {
    const { hoursInput, minutesInput } = renderPicker();

    hoursInput.focus();
    changeInput(hoursInput, '1');

    expect(minutesInput).not.toHaveFocus();
  });

  it('ArrowRight from hours moves focus to minutes', () => {
    const { hoursInput, minutesInput } = renderPicker();

    hoursInput.focus();
    fireEvent.keyDown(hoursInput, { key: 'ArrowRight' });

    expect(minutesInput).toHaveFocus();
  });

  it('ArrowLeft from minutes moves focus back to hours', () => {
    const { hoursInput, minutesInput } = renderPicker();

    minutesInput.focus();
    fireEvent.keyDown(minutesInput, { key: 'ArrowLeft' });

    expect(hoursInput).toHaveFocus();
  });

  it('Tab from hours moves focus to minutes', () => {
    const { hoursInput, minutesInput } = renderPicker();

    hoursInput.focus();
    fireEvent.keyDown(hoursInput, { key: 'Tab', shiftKey: false });

    expect(minutesInput).toHaveFocus();
  });

  it('Shift+Tab from minutes moves focus back to hours', () => {
    const { hoursInput, minutesInput } = renderPicker();

    minutesInput.focus();
    fireEvent.keyDown(minutesInput, { key: 'Tab', shiftKey: true });

    expect(hoursInput).toHaveFocus();
  });
});

// ─── onFinish callback ───────────────────────────────────────────────────────

describe('TimePicker — onFinish callback', () => {
  it('calls onFinish with correct HH:MM after two digits in minutes', async () => {
    const { hoursInput, minutesInput, onFinish } = renderPicker();

    changeInput(hoursInput, '14');
    await waitFor(() => expect(minutesInput).toHaveFocus());

    changeInput(minutesInput, '30');

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledWith('14:30');
    });
  });

  it('clamps hours > 23 in the input value', async () => {
    const { hoursInput, minutesInput } = renderPicker();

    changeInput(hoursInput, '29'); // clamp(29, 0, 23) = 23

    // Value is clamped immediately on two-digit input
    await waitFor(() => expect(hoursInput).toHaveValue('23'));
    // And focus advances to minutes
    await waitFor(() => expect(minutesInput).toHaveFocus());
  });

  it('clamps minutes > 59', async () => {
    const { hoursInput, minutesInput, onFinish } = renderPicker();

    changeInput(hoursInput, '12');
    await waitFor(() => expect(minutesInput).toHaveFocus());

    changeInput(minutesInput, '99'); // clamped to 59

    await waitFor(() => {
      const [, m] = (onFinish.mock.calls.at(-1)?.[0] as string).split(':').map(Number);
      expect(m).toBeLessThanOrEqual(59);
    });
  });

  it('calls onFinish when auto-advancing via single digit >= 3 then completing minutes', async () => {
    const { hoursInput, minutesInput, onFinish } = renderPicker();

    changeInput(hoursInput, '7'); // auto-advance, hour = "07"
    await waitFor(() => expect(minutesInput).toHaveFocus());

    changeInput(minutesInput, '45');

    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledWith('07:45');
    });
  });
});

// ─── blur normalization ──────────────────────────────────────────────────────

describe('TimePicker — blur normalization', () => {
  it('sets hours to "00" on blur when field is empty', () => {
    const { hoursInput } = renderPicker();

    changeInput(hoursInput, '');
    fireEvent.blur(hoursInput);

    expect(hoursInput).toHaveValue('00');
  });

  it('pads single-digit minutes to two chars on blur', () => {
    const { minutesInput } = renderPicker('12:00');

    changeInput(minutesInput, '5');
    fireEvent.blur(minutesInput);

    expect(minutesInput).toHaveValue('05');
  });

  it('sets minutes to "00" on blur when field is empty', () => {
    const { minutesInput } = renderPicker('12:30');

    changeInput(minutesInput, '');
    fireEvent.blur(minutesInput);

    expect(minutesInput).toHaveValue('00');
  });
});

// ─── initialTime prop ────────────────────────────────────────────────────────

describe('TimePicker — initialTime prop', () => {
  it('initializes inputs with the provided time', () => {
    renderPicker('08:45');
    expect(screen.getByLabelText('Hour')).toHaveValue('08');
    expect(screen.getByLabelText('Minute')).toHaveValue('45');
  });

  it('initializes correctly for midnight "00:00"', () => {
    renderPicker('00:00');
    expect(screen.getByLabelText('Hour')).toHaveValue('00');
    expect(screen.getByLabelText('Minute')).toHaveValue('00');
  });

  it('initializes correctly for end of day "23:59"', () => {
    renderPicker('23:59');
    expect(screen.getByLabelText('Hour')).toHaveValue('23');
    expect(screen.getByLabelText('Minute')).toHaveValue('59');
  });
});

// ─── mode toggle ─────────────────────────────────────────────────────────────

describe('TimePicker — native/manual mode toggle', () => {
  it('switches to native mode when "Системный" button is clicked', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: /системный/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText('Minute')).not.toBeInTheDocument();
    });
  });

  it('switches back to manual mode when "Ручной ввод" is clicked', async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(screen.getByRole('button', { name: /системный/i }));
    await waitFor(() => expect(screen.queryByLabelText('Minute')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /ручной ввод/i }));
    await waitFor(() => expect(screen.getByLabelText('Minute')).toBeInTheDocument());
  });

  it('toggle button label reflects current mode', () => {
    renderPicker();
    // starts in manual → offers "Системный"
    expect(screen.getByRole('button', { name: /системный/i })).toBeInTheDocument();
  });
});
