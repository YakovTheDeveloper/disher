import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { createRef } from 'react';
import { EditableList, EditableListRef } from './EditableList';

const makeItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: `item-${i + 1}`, name: `Item ${i + 1}` }));

const renderList = (items = makeItems(3)) => {
  const ref = createRef<EditableListRef>();
  render(
    <EditableList
      ref={ref}
      items={items}
      renderItem={(item) => item.name}
    />
  );
  return { ref };
};

// ─── rendering ──────────────────────────────────────────────────────────────

describe('EditableList — rendering', () => {
  it('renders all items', () => {
    renderList();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('shows delete buttons for all items when more than 1', () => {
    renderList();
    const deleteButtons = screen.getAllByRole('button', { name: '×' });
    expect(deleteButtons).toHaveLength(3);
  });

  it('hides delete button when only 1 item', () => {
    renderList(makeItems(1));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ─── delete / restore ───────────────────────────────────────────────────────

describe('EditableList — delete and restore', () => {
  it('marks item as deleted (strikethrough) on × click', () => {
    renderList();
    const deleteButtons = screen.getAllByRole('button', { name: '×' });
    fireEvent.click(deleteButtons[0]);

    // Item 1 should now show restore button instead of delete
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '↩' })).toHaveLength(1);
  });

  it('restores item on ↩ click', () => {
    renderList();
    const deleteButtons = screen.getAllByRole('button', { name: '×' });
    fireEvent.click(deleteButtons[0]);

    const restoreButton = screen.getByRole('button', { name: '↩' });
    fireEvent.click(restoreButton);

    // All items should show × again
    expect(screen.getAllByRole('button', { name: '×' })).toHaveLength(3);
    expect(screen.queryByRole('button', { name: '↩' })).not.toBeInTheDocument();
  });

  it('prevents deleting the last active item', () => {
    renderList(makeItems(2));
    const deleteButtons = screen.getAllByRole('button', { name: '×' });

    // Delete first item
    fireEvent.click(deleteButtons[0]);

    // Now only 1 active item — no × button should be visible
    expect(screen.queryByRole('button', { name: '×' })).not.toBeInTheDocument();
    // But restore button should still be there for deleted item
    expect(screen.getByRole('button', { name: '↩' })).toBeInTheDocument();
  });
});

// ─── getResultedItemsIds ────────────────────────────────────────────────────

describe('EditableList — getResultedItemsIds', () => {
  it('returns all item ids when nothing deleted', () => {
    const { ref } = renderList();
    const result = ref.current!.getResultedItemsIds();
    expect(result.asArray).toEqual(['item-1', 'item-2', 'item-3']);
    expect(result.asSet).toEqual(new Set(['item-1', 'item-2', 'item-3']));
  });

  it('excludes deleted items from result', () => {
    const { ref } = renderList();
    const deleteButtons = screen.getAllByRole('button', { name: '×' });
    fireEvent.click(deleteButtons[1]); // delete Item 2

    const result = ref.current!.getResultedItemsIds();
    expect(result.asArray).toEqual(['item-1', 'item-3']);
    expect(result.asSet.has('item-2')).toBe(false);
  });

  it('includes restored items in result', () => {
    const { ref } = renderList();
    const deleteButtons = screen.getAllByRole('button', { name: '×' });
    fireEvent.click(deleteButtons[0]); // delete Item 1

    const restoreButton = screen.getByRole('button', { name: '↩' });
    fireEvent.click(restoreButton); // restore Item 1

    const result = ref.current!.getResultedItemsIds();
    expect(result.asArray).toEqual(['item-1', 'item-2', 'item-3']);
  });
});
