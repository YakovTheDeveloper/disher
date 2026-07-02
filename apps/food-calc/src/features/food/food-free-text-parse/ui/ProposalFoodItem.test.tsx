import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ProposalFoodItem, type ProposalFoodItemProps } from './ProposalFoodItem';

// Смена label-стратегии (было: FoodName-как-label; стало: внешний TapTarget-как-
// label вокруг имени во FoodEntryCard) — эти тесты страхуют focus-capture rename-
// флоу: pointerdown по имени ДОЛЖЕН застолбить uid ряда в dataset input-цели ДО
// фокуса. Родитель (InlineWriteFoodReview.handleReviewFocusCapture) читает
// dataset.activeItemUid на focus и вызывает startEdit; отвались стэш — правка
// открыла бы НЕ тот ряд (или молчала). См. handoff food-entry-card-refactor.

const SEARCH_INPUT_ID = 'proposal-edit-search';

const baseItem: ProposalFoodItemProps['item'] = {
  name: 'Яблоко',
  details: 'с кожурой',
  originalName: 'яблочко',
  quantity: 150,
  time: '08:30',
};

function renderProposal(overrides: Partial<ProposalFoodItemProps> = {}) {
  // searchInputId-цель = всегда-смонтированный edit-search input предложки; в реале
  // он живёт СНАРУЖИ ряда. Кладём в body, чтобы document.getElementById его нашёл.
  const trigger = document.createElement('input');
  trigger.id = SEARCH_INPUT_ID;
  document.body.appendChild(trigger);

  const props: ProposalFoodItemProps = {
    uid: 'uid-1',
    item: baseItem,
    searchInputId: SEARCH_INPUT_ID,
    onCommitTime: vi.fn(),
    onCommitQuantity: vi.fn(),
    ...overrides,
  };
  // ProposalFoodItem рендерит <li> (LongPressRow) — оборачиваем в <ul>, чтобы не
  // ловить DOM-nesting warning.
  render(
    <ul>
      <ProposalFoodItem {...props} />
    </ul>
  );
  return { trigger };
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('ProposalFoodItem — focus-capture rename флоу', () => {
  it('pointerdown по имени стэшит uid ряда в dataset input-цели', () => {
    const { trigger } = renderProposal({ uid: 'uid-42' });

    const name = screen.getByText('Яблоко');
    fireEvent.pointerDown(name);

    expect(trigger.dataset.activeItemUid).toBe('uid-42');
  });

  it('тап-зона имени = <label htmlFor={searchInputId}> (iOS-focus канон)', () => {
    renderProposal();

    const label = screen.getByText('Яблоко').closest('label');
    expect(label).not.toBeNull();
    expect(label).toHaveAttribute('for', SEARCH_INPUT_ID);
  });
});
