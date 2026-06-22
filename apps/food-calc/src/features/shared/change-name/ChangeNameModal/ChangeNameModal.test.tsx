// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ChangeNameModal from './ChangeNameModal';

// Контракт урны удаления. ChangeNameModal обслуживает rename И блюда, и продукта
// (DishBuilderPage / ProductDrawer). Серая урна (HeaderDeleteButton) появляется в
// правом слоте шапки ТОЛЬКО когда передан `onDelete`; её клик зовёт `onDelete`
// (подтверждение через ConfirmModal + сама мутация + уход с экрана — на стороне
// caller'а, не здесь). Это контракт на стыке файлов — tsc его не ловит.
//
// Рендерим collapsed (isExpanded=false): шапка с урной монтируется всегда
// (ModalByLabel всегда рендерит content), а ActionButtons + useKeyboardStick +
// scrollIntoView гейтятся `isExpanded`, поэтому в collapsed они не выполняются и
// тест не цепляет их jsdom-side-effects.
describe('ChangeNameModal — delete affordance contract', () => {
  const baseProps = {
    currentName: 'Омлет',
    isExpanded: false,
    onClose: () => {},
    onChangeName: () => {},
  };

  it('omits the delete urn when onDelete is not provided', () => {
    render(<ChangeNameModal {...baseProps} />);
    expect(screen.queryByRole('button', { name: /удалить/i })).not.toBeInTheDocument();
  });

  it('renders the delete urn with the given label when onDelete is provided', () => {
    render(
      <ChangeNameModal {...baseProps} onDelete={() => {}} deleteLabel="Удалить блюдо" />,
    );
    expect(screen.getByRole('button', { name: 'Удалить блюдо' })).toBeInTheDocument();
  });

  it('calls onDelete exactly once on urn click — and never before a click', () => {
    const onDelete = vi.fn();
    render(
      <ChangeNameModal {...baseProps} onDelete={onDelete} deleteLabel="Удалить продукт" />,
    );
    // Mount alone must not trigger deletion (no accidental delete-on-render).
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Удалить продукт' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
