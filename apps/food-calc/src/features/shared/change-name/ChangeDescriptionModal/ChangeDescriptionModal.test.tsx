// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ChangeDescriptionModal from './ChangeDescriptionModal';
import { CHANGE_DESCRIPTION_INPUT_ID } from './constants';

// Контракт сохранения — ГЛАВНОЕ намеренное отличие от клона-источника
// ChangeNameModal: ПУСТОЕ значение валидно и стирает описание
// (onChangeDescription('')), тогда как у имени пусто = тихий no-op. Плюс
// «без изменений → onClose без мутации» (паритет с именем). Это контракт на
// стыке файлов (ProductDrawer передаёт onChangeDescription → updateProduct) —
// tsc его не ловит.
//
// Рендерим expanded: кнопка «Готово» гейтится isExpanded. jsdom не умеет
// scrollIntoView — стаб, как в FoodEntryCreateModals.test.
Element.prototype.scrollIntoView = vi.fn();

const field = () =>
  document.getElementById(CHANGE_DESCRIPTION_INPUT_ID) as HTMLTextAreaElement;

describe('ChangeDescriptionModal — save contract (пусто = стереть)', () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onChangeDescription: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onChangeDescription = vi.fn();
  });

  const renderExpanded = (currentDescription: string) =>
    render(
      <ChangeDescriptionModal
        currentDescription={currentDescription}
        isExpanded
        onClose={onClose}
        onChangeDescription={onChangeDescription}
      />,
    );

  it('очищенное поле СТИРАЕТ: onChangeDescription("") — не no-op, как у имени', () => {
    renderExpanded('сорт Гала');
    fireEvent.change(field(), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(onChangeDescription).toHaveBeenCalledExactlyOnceWith('');
  });

  it('без изменений → onClose, мутация НЕ зовётся', () => {
    renderExpanded('сорт Гала');
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(onChangeDescription).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('новое значение уходит триммленным (мутации не триммят — тримм здесь)', () => {
    renderExpanded('');
    fireEvent.change(field(), { target: { value: '  на говяжьем бульоне  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(onChangeDescription).toHaveBeenCalledExactlyOnceWith('на говяжьем бульоне');
  });

  it('пусто при и так пустом описании → onClose без мутации (нечего стирать)', () => {
    renderExpanded('');
    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(onChangeDescription).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
