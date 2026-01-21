import React, { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import TimePicker from './TimePicker'; // Путь к вашему файлу

// Обертка для управления состоянием в тестах
const TestWrapper = ({ onChange }: { onChange?: (val: string) => void }) => {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  return (
    <TimePicker
      hours={hours}
      minutes={minutes}
      setHours={setHours}
      setMinutes={setMinutes}
      onChange={onChange}
    />
  );
};

describe('TimePicker Component Flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('позволяет вводить часы и переходит к минутам при вводе 2 цифр', async () => {
    const user = userEvent.setup({
      advanceTimers: () => vi.runOnlyPendingTimers(),
    });
    render(<TestWrapper />);

    const hourInput = screen.getByLabelText(/hour/i);
    const minuteInput = screen.getByLabelText(/minute/i);

    await user.type(hourInput, '12');

    expect(hourInput).toHaveValue('12');
    expect(minuteInput).toHaveFocus();
  });

  it('автоматически переходит к минутам, если введена цифра >= 3 в поле часов', async () => {
    const user = userEvent.setup({
      advanceTimers: () => vi.runOnlyPendingTimers(),
    });
    render(<TestWrapper />);

    const hourInput = screen.getByLabelText(/hour/i);
    const minuteInput = screen.getByLabelText(/minute/i);

    // Ввод "4" сразу должен превратиться в "04" и перевести фокус
    await user.type(hourInput, '4');

    expect(hourInput).toHaveValue('04');
    expect(minuteInput).toHaveFocus();
  });

  it('нормализует значение и вызывает onChange при заполнении минут', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({
      advanceTimers: () => vi.runOnlyPendingTimers(),
    });
    render(<TestWrapper onChange={onChange} />);

    const hourInput = screen.getByLabelText(/hour/i);
    await user.type(hourInput, '10');

    const minuteInput = screen.getByLabelText(/minute/i);
    await user.type(minuteInput, '45');

    // Ждем асинхронный finishAndBlur (из-за setTimeout в коде)
    await act(async () => {
      vi.runAllTimers();
    });

    expect(onChange).toHaveBeenCalledWith('10:45');
    expect(minuteInput).not.toHaveFocus(); // Должен сработать blur
  });

  it('навигация: ArrowRight переводит фокус на минуты, ArrowLeft — на часы', async () => {
    const user = userEvent.setup({
      advanceTimers: () => vi.runOnlyPendingTimers(),
    });
    render(<TestWrapper />);

    const hourInput = screen.getByLabelText(/hour/i);
    const minuteInput = screen.getByLabelText(/minute/i);

    await user.click(hourInput);
    await user.keyboard('{ArrowRight}');
    expect(minuteInput).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(hourInput).toHaveFocus();
  });

  it('удаление: Backspace в пустом поле минут переводит фокус в часы и удаляет символ', async () => {
    const user = userEvent.setup({
      advanceTimers: () => vi.runOnlyPendingTimers(),
    });
    render(<TestWrapper />);

    const hourInput = screen.getByLabelText(/hour/i);
    const minuteInput = screen.getByLabelText(/minute/i);

    // Сначала введем время
    await user.type(hourInput, '12');
    await user.clear(minuteInput); // Убедимся, что минуты пусты

    await user.click(minuteInput);
    await user.keyboard('{Backspace}');

    expect(hourInput).toHaveFocus();
    expect(hourInput).toHaveValue('1'); // Было "12", стал "1"
  });

  it('инкременты: кнопки ↑/↓ корректно изменяют часы и минуты', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({
      advanceTimers: () => vi.runOnlyPendingTimers(),
    });
    render(<TestWrapper onChange={onChange} />);

    const buttons = screen.getAllByRole('button');
    // Индексы кнопок: 0: HH↑, 1: HH↓, 2: MM↑, 3: MM↓

    await user.click(buttons[0]); // HH + 1
    expect(screen.getByLabelText(/hour/i)).toHaveValue('01');

    await user.click(buttons[2]); // MM + 5
    expect(screen.getByLabelText(/minute/i)).toHaveValue('05');

    expect(onChange).toHaveBeenLastCalledWith('01:05');
  });

  it('обработка вставки (Paste): распознает формат HH:MM', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({
      advanceTimers: () => vi.runOnlyPendingTimers(),
    });
    render(<TestWrapper onChange={onChange} />);

    const hourInput = screen.getByLabelText(/hour/i);

    await user.click(hourInput);
    await user.paste('23:59');

    expect(screen.getByLabelText(/hour/i)).toHaveValue('23');
    expect(screen.getByLabelText(/minute/i)).toHaveValue('59');
    expect(onChange).toHaveBeenCalledWith('23:59');
  });

  it('нормализация при потере фокуса (Blur)', async () => {
    const user = userEvent.setup({
      advanceTimers: () => vi.runOnlyPendingTimers(),
    });
    render(<TestWrapper />);

    const hourInput = screen.getByLabelText(/hour/i);
    const minuteInput = screen.getByLabelText(/minute/i);

    // Вводим одну цифру в часы и уходим
    await user.type(hourInput, '1');
    await user.click(document.body);
    // Логика handleHoursBlur при hours.length === 1 не паддит до '01' в стейте,
    // но если поле пустое — ставит '00'. Проверим пустое:
    await user.clear(hourInput);
    await user.click(document.body);
    expect(hourInput).toHaveValue('00');

    // Минуты: если оставить "5" и уйти -> станет "05"
    await user.type(minuteInput, '5');
    await user.click(document.body);
    expect(minuteInput).toHaveValue('05');
  });
});
