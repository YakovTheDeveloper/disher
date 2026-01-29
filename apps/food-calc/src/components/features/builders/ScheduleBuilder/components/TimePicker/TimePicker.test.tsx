import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import TimePicker from './TimePicker';
import React from 'react';

function Wrapper() {
  const [hours, setHours] = React.useState('');
  const [minutes, setMinutes] = React.useState('');

  return (
    <TimePicker
      hours={hours}
      minutes={minutes}
      setHours={setHours}
      setMinutes={setMinutes}
      onChange={() => {}}
      onFinish={() => {}}
    />
  );
}

describe('TimePicker', () => {
  it('jumps to minutes input after entering two digits in hours, blur when entring two digits in minutes', async () => {
    const user = userEvent.setup();
    render(<Wrapper />);

    const hoursInput = screen.getByLabelText('Hour');
    const minutesInput = screen.getByLabelText('Minute');

    await user.click(hoursInput);
    await user.type(hoursInput, '12');

    await waitFor(() => {
      expect(minutesInput).toHaveFocus();
    });

    await user.type(minutesInput, '12');
    await waitFor(() => {
      expect(minutesInput).not.toHaveFocus();
    });
  });
});
