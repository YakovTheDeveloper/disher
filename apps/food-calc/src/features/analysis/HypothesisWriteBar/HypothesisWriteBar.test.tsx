import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HypothesisWriteBar from './HypothesisWriteBar';

// saveHypothesis is the only entity API the bar touches — stub it (no Dexie).
const saveHypothesis = vi.fn<(input: { title: string; body: string }) => Promise<string>>(
  () => Promise.resolve('new-id'),
);
vi.mock('@/entities/hypothesis', () => ({
  saveHypothesis: (input: { title: string; body: string }) => saveHypothesis(input),
}));

const TITLE_PLACEHOLDER = 'Ваша гипотеза?';

beforeEach(() => {
  saveHypothesis.mockClear();
});

// Title-only creation (2026-07-17): the bar writes a bare title; the optional
// `body` is filled later via EditHypothesisModal on row-tap, so the create path
// always saves `body: ''`.
describe('HypothesisWriteBar — submit', () => {
  it('Enter creates the hypothesis with an empty body, then clears + reports the id', async () => {
    const onCreated = vi.fn();
    render(<HypothesisWriteBar onCreated={onCreated} />);
    const title = screen.getByPlaceholderText(TITLE_PLACEHOLDER);

    fireEvent.change(title, { target: { value: 'Сон и кофе' } });
    fireEvent.keyDown(title, { key: 'Enter' });

    await waitFor(() =>
      expect(saveHypothesis).toHaveBeenCalledWith({ title: 'Сон и кофе', body: '' }),
    );
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('new-id'));
    // Cleared on success.
    expect(title).toHaveValue('');
  });

  it('does not submit an empty title', () => {
    render(<HypothesisWriteBar onCreated={() => {}} />);
    const title = screen.getByPlaceholderText(TITLE_PLACEHOLDER);
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(saveHypothesis).not.toHaveBeenCalled();
  });
});

// Ядро унификации 2026-07-02: send-монета content-driven (`send.visible = hasText`)
// — прячется при пустом title, появляется как только он есть. Раньше «постоянная
// монета» висела серой всегда; регресс к ней тип-чек не поймает.
describe('HypothesisWriteBar — send content-driven', () => {
  it('пустой title → send-монеты нет; после ввода — появляется', () => {
    render(<HypothesisWriteBar onCreated={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Добавить гипотезу' })).toBeNull();

    fireEvent.change(screen.getByPlaceholderText(TITLE_PLACEHOLDER), {
      target: { value: 'Сон и кофе' },
    });
    expect(screen.getByRole('button', { name: 'Добавить гипотезу' })).toBeInTheDocument();
  });
});
