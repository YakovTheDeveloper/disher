import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ProposalFoodItem, type ProposalFoodItemProps } from './ProposalFoodItem';

// Ряд предложки правится ОДНИМ флоу еды: имя / количество / время — label-триггеры
// на инпуты шагов (ModalByLabel-канон), инлайн-полей в ряду нет. Имя ряда с
// подобранной едой ведёт в ХАБ-чузер (CHOOSE_INPUT: «Поменять еду»/«…особенности»);
// у ещё-нераспознанного (pending) — СРАЗУ в поиск (менять особенности не у чего).
// Эти тесты страхуют делегацию: pointerdown ДОЛЖЕН застолбить uid ряда в dataset
// инпута-цели ДО фокуса. Родитель (InlineWriteFoodReview.handleEditFocusCapture)
// читает dataset.activeItemUid на focus и праймит им флоу; отвались стэш — правка
// открыла бы НЕ тот ряд (или молчала).

const INPUT_IDS: ProposalFoodItemProps['inputIds'] = {
  SEARCH_INPUT: 'proposal-edit-search',
  QUANTITY_INPUT: 'proposal-edit-quantity',
  TIME_INPUT: 'proposal-edit-time',
  CHOOSE_INPUT: 'proposal-edit-choose',
};

const baseItem: ProposalFoodItemProps['item'] = {
  name: 'Яблоко',
  details: 'с кожурой',
  originalName: 'яблочко',
  quantity: 150,
  time: '08:30',
};

function renderProposal(overrides: Partial<ProposalFoodItemProps> = {}) {
  // Инпуты шагов живут в реале СНАРУЖИ ряда (внутри модалок). Кладём в body,
  // чтобы document.getElementById их нашёл.
  const triggers = Object.fromEntries(
    Object.entries(INPUT_IDS).map(([key, id]) => {
      const input = document.createElement('input');
      input.id = id;
      document.body.appendChild(input);
      return [key, input];
    })
  ) as Record<keyof typeof INPUT_IDS, HTMLInputElement>;

  const props: ProposalFoodItemProps = {
    uid: 'uid-1',
    item: baseItem,
    inputIds: INPUT_IDS,
    ...overrides,
  };
  // ProposalFoodItem рендерит <li> (LongPressRow) — оборачиваем в <ul>, чтобы не
  // ловить DOM-nesting warning.
  render(
    <ul>
      <ProposalFoodItem {...props} />
    </ul>
  );
  return triggers;
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('ProposalFoodItem — делегация правки во флоу еды', () => {
  it('pointerdown по имени (ряд с едой) стэшит uid в dataset инпута ЧУЗЕРА', () => {
    const triggers = renderProposal({ uid: 'uid-42' });

    fireEvent.pointerDown(screen.getByText('Яблоко'));

    expect(triggers.CHOOSE_INPUT.dataset.activeItemUid).toBe('uid-42');
  });

  it('pointerdown по имени pending-ряда (нет еды) стэшит uid в dataset ПОИСКА', () => {
    const triggers = renderProposal({ uid: 'uid-42', isUnresolved: true });

    // У нераспознанного имя-fallback = оригинал ('яблочко'), тап ведёт прямо в поиск.
    fireEvent.pointerDown(screen.getByText('яблочко'));

    expect(triggers.SEARCH_INPUT.dataset.activeItemUid).toBe('uid-42');
  });

  it('pointerdown по количеству стэшит uid в dataset инпута количества', () => {
    const triggers = renderProposal({ uid: 'uid-42' });

    fireEvent.pointerDown(screen.getByText('150'));

    expect(triggers.QUANTITY_INPUT.dataset.activeItemUid).toBe('uid-42');
  });

  it('pointerdown по времени стэшит uid в dataset инпута времени', () => {
    const triggers = renderProposal({ uid: 'uid-42' });

    fireEvent.pointerDown(screen.getByText('8:30'));

    expect(triggers.TIME_INPUT.dataset.activeItemUid).toBe('uid-42');
  });

  it('имя / количество / время = <label htmlFor> на инпуты шагов (iOS-focus канон)', () => {
    renderProposal();

    // Ряд с едой: имя → хаб-чузер.
    expect(screen.getByText('Яблоко').closest('label')).toHaveAttribute(
      'for',
      INPUT_IDS.CHOOSE_INPUT
    );
    expect(screen.getByText('150').closest('label')).toHaveAttribute(
      'for',
      INPUT_IDS.QUANTITY_INPUT
    );
    expect(screen.getByText('8:30').closest('label')).toHaveAttribute(
      'for',
      INPUT_IDS.TIME_INPUT
    );
  });
});
