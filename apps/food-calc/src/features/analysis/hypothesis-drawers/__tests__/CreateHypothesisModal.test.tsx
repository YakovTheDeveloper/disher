/* eslint-disable @typescript-eslint/no-explicit-any -- lightweight test mocks */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { useState, type FocusEvent } from 'react';
import '@testing-library/jest-dom/vitest';

// jsdom не имплементирует scrollIntoView, который мы зовём в useEffect для iOS.
Element.prototype.scrollIntoView = vi.fn();

// Сначала моки — ДО динамического импорта тестируемого модуля.
const saveHypothesisMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@/entities/hypothesis', () => ({
  saveHypothesis: (...args: any[]) => saveHypothesisMock(...args),
}));
vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => toastSuccessMock(...args),
    error: (...args: any[]) => toastErrorMock(...args),
  },
}));

const { default: CreateHypothesisModal, CREATE_HYPOTHESIS_TITLE_INPUT_ID } =
  await import('../CreateHypothesisModal');

beforeEach(() => {
  vi.clearAllMocks();
  saveHypothesisMock.mockResolvedValue('new-id');
});

afterEach(() => {
  vi.useRealTimers();
});

const expanded = (): HTMLElement | null =>
  document.querySelector('[data-modal-by-label="expanded"]');

const titleInput = (): HTMLTextAreaElement | null =>
  document.getElementById(CREATE_HYPOTHESIS_TITLE_INPUT_ID) as HTMLTextAreaElement | null;

describe('CreateHypothesisModal', () => {
  // (a) label-focus → onFocusCapture → step='create' → Modal раскрывается.
  // Тест интеграционный — воспроизводит то, что делает Laboratory/HypothesesSlide.
  it('label focus on the title input expands the modal', () => {
    const Parent = () => {
      const [step, setStep] = useState<'idle' | 'create'>('idle');
      const handleFocusCapture = (e: FocusEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).id === CREATE_HYPOTHESIS_TITLE_INPUT_ID) {
          setStep('create');
        }
      };
      return (
        <div onFocusCapture={handleFocusCapture}>
          <label htmlFor={CREATE_HYPOTHESIS_TITLE_INPUT_ID} data-testid="trigger">
            + Гипотеза
          </label>
          <CreateHypothesisModal
            isExpanded={step === 'create'}
            onClose={() => setStep('idle')}
          />
        </div>
      );
    };

    render(<Parent />);

    // До клика модалка свёрнута.
    expect(expanded()).toBeNull();
    const input = titleInput();
    expect(input).not.toBeNull();

    // Фокусим инпут — браузер сделал бы это сам по label-клику; в jsdom
    // эмулируем напрямую (label htmlFor → focus → onFocusCapture).
    fireEvent.focus(input!);

    expect(expanded()).not.toBeNull();
  });

  // (b) Save success: saveHypothesis вызывается с trimmed полями, toast.success
  // fires, onClose fires.
  it('saves the hypothesis, fires toast, and closes', async () => {
    const onClose = vi.fn();
    render(<CreateHypothesisModal isExpanded onClose={onClose} />);

    const input = titleInput();
    expect(input).not.toBeNull();
    // AutoGrowSearch это <textarea>, onChange читает event.currentTarget.value.
    fireEvent.input(input!, { target: { value: '  Кофе после обеда → сон  ' } });

    // Кнопка Сохранить — единственная `[aria-label="Готово"]` в expanded modal.
    const saveBtn = document.querySelector(
      '[data-modal-by-label="expanded"] [aria-label="Готово"]',
    ) as HTMLButtonElement | null;
    expect(saveBtn).not.toBeNull();
    expect(saveBtn!.disabled).toBe(false);

    await act(async () => {
      fireEvent.click(saveBtn!);
    });

    await waitFor(() => {
      expect(saveHypothesisMock).toHaveBeenCalledWith({
        title: 'Кофе после обеда → сон',
        body: '',
      });
    });
    expect(toastSuccessMock).toHaveBeenCalledWith('Гипотеза добавлена');
    expect(onClose).toHaveBeenCalledOnce();
  });

  // (c) Save error: rejection → submitting сбрасывается, можно ретраить
  // (вторая попытка вызывает saveHypothesis повторно).
  it('on save failure shows error toast and stays open for retry', async () => {
    const onClose = vi.fn();
    saveHypothesisMock.mockRejectedValueOnce(new Error('network'));
    // Глушим консольную ошибку — handleSubmit делает console.error на failure.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<CreateHypothesisModal isExpanded onClose={onClose} />);
    fireEvent.input(titleInput()!, { target: { value: 'Гипотеза' } });

    const saveBtn = () =>
      document.querySelector(
        '[data-modal-by-label="expanded"] [aria-label="Готово"]',
      ) as HTMLButtonElement;

    await act(async () => {
      fireEvent.click(saveBtn());
    });

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    // submitting=false снова → кнопка снова enabled.
    expect(saveBtn().disabled).toBe(false);

    // Второй клик — теперь success path.
    saveHypothesisMock.mockResolvedValueOnce('new-id');
    await act(async () => {
      fireEvent.click(saveBtn());
    });
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(saveHypothesisMock).toHaveBeenCalledTimes(2);

    errSpy.mockRestore();
  });

  // (d) Re-open сбрасывает поля: открыл, ввёл title, закрыл, открыл заново —
  // инпут пустой. Гарантия useEffect([isExpanded]).
  it('resets title and body on each reopen', () => {
    const { rerender } = render(
      <CreateHypothesisModal isExpanded onClose={() => {}} />,
    );

    fireEvent.input(titleInput()!, { target: { value: 'Старая гипотеза' } });
    expect(titleInput()!.value).toBe('Старая гипотеза');

    // Закрытие.
    rerender(<CreateHypothesisModal isExpanded={false} onClose={() => {}} />);
    // Повторное открытие — useEffect триггерится на изменение isExpanded.
    rerender(<CreateHypothesisModal isExpanded onClose={() => {}} />);

    expect(titleInput()!.value).toBe('');
  });
});
