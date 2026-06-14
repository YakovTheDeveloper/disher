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
const BODY_PLACEHOLDER = 'Что именно проверяем? (необязательно)';

beforeEach(() => {
  saveHypothesis.mockClear();
});

describe('HypothesisWriteBar — title-first', () => {
  it('disables «Подробности» until there is a title, enables it once typed', () => {
    render(<HypothesisWriteBar onCreated={() => {}} />);
    const clip = screen.getByRole('button', { name: 'Добавить подробности' });
    expect(clip).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(TITLE_PLACEHOLDER), {
      target: { value: 'Сон и кофе' },
    });
    expect(clip).toBeEnabled();
  });

  it('drops the body when the title is cleared to empty (no orphan body)', () => {
    render(<HypothesisWriteBar onCreated={() => {}} />);
    const title = screen.getByPlaceholderText(TITLE_PLACEHOLDER);
    const body = screen.getByPlaceholderText(BODY_PLACEHOLDER);

    fireEvent.change(title, { target: { value: 'Сон и кофе' } });
    fireEvent.change(body, { target: { value: 'детали' } });
    expect(body).toHaveValue('детали');

    // Clear the title → body must be wiped so it can't ride into the next one.
    fireEvent.change(title, { target: { value: '' } });
    expect(body).toHaveValue('');
  });
});

describe('HypothesisWriteBar — submit', () => {
  it('Enter creates the hypothesis with title + body, then clears + reports the id', async () => {
    const onCreated = vi.fn();
    render(<HypothesisWriteBar onCreated={onCreated} />);
    const title = screen.getByPlaceholderText(TITLE_PLACEHOLDER);
    const body = screen.getByPlaceholderText(BODY_PLACEHOLDER);

    fireEvent.change(title, { target: { value: 'Сон и кофе' } });
    fireEvent.change(body, { target: { value: 'детали' } });
    fireEvent.keyDown(title, { key: 'Enter' });

    await waitFor(() =>
      expect(saveHypothesis).toHaveBeenCalledWith({ title: 'Сон и кофе', body: 'детали' }),
    );
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('new-id'));
    // Cleared on success.
    expect(title).toHaveValue('');
    expect(body).toHaveValue('');
  });

  it('does not submit an empty title', () => {
    render(<HypothesisWriteBar onCreated={() => {}} />);
    const title = screen.getByPlaceholderText(TITLE_PLACEHOLDER);
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(saveHypothesis).not.toHaveBeenCalled();
  });
});
