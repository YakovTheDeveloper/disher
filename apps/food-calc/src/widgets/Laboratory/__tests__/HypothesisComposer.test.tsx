import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HypothesisComposer from '../HypothesisComposer';
import { saveHypothesis } from '@/entities/hypothesis';

// Mock the entity layer (avoids loading Dexie) and the toaster.
vi.mock('@/entities/hypothesis', () => ({ saveHypothesis: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedSave = vi.mocked(saveHypothesis);

describe('HypothesisComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables «Добавить» until the title is non-empty', () => {
    render(<HypothesisComposer onCreated={() => {}} />);
    const button = screen.getByRole('button', { name: 'Добавить' });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Сон и кофе' },
    });
    expect(button).toBeEnabled();
  });

  it('saves a sanitized title-only hypothesis, fires onCreated, clears the field', async () => {
    mockedSave.mockResolvedValue('new-id');
    const onCreated = vi.fn();
    render(<HypothesisComposer onCreated={onCreated} />);

    const field = screen.getByRole('textbox') as HTMLTextAreaElement;
    // Leading/trailing space + an embedded newline — sanitize collapses both.
    fireEvent.change(field, { target: { value: '  Сон\nи кофе  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('new-id'));
    expect(mockedSave).toHaveBeenCalledWith({ title: 'Сон и кофе', body: '' });
    expect(field.value).toBe('');
  });

  it('keeps the typed title and re-enables the button when the save fails', async () => {
    mockedSave.mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<HypothesisComposer onCreated={() => {}} />);

    const field = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: 'Сон и кофе' } });
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }));

    await waitFor(() => expect(mockedSave).toHaveBeenCalled());
    expect(field.value).toBe('Сон и кофе');
    expect(screen.getByRole('button', { name: 'Добавить' })).toBeEnabled();
  });

  it('submits on Enter and keeps focus in the field', async () => {
    mockedSave.mockResolvedValue('id-enter');
    const onCreated = vi.fn();
    render(<HypothesisComposer onCreated={onCreated} />);

    const field = screen.getByRole('textbox') as HTMLTextAreaElement;
    field.focus();
    fireEvent.change(field, { target: { value: 'Кофе' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('id-enter'));
    expect(mockedSave).toHaveBeenCalledWith({ title: 'Кофе', body: '' });
    // Enter must not blur — the field stays focused for entering a series.
    expect(document.activeElement).toBe(field);
    expect(field.value).toBe('');
  });
});
