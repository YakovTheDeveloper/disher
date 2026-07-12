/* eslint-disable @typescript-eslint/no-explicit-any -- lightweight test-mock props */
import { useSyncExternalStore } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { DetailsChips } from './DetailsChips';

// Не зависим от настоящего dexie / каталога — мокаем источники данных и
// мутацию. Тесты проверяют ровно UI-инварианты группировки и поведение
// long-press на custom-чипах.
vi.mock('@/entities/product', () => ({
  useProduct: () => ({ categories: JSON.stringify(['meat']) }),
}));

// Реактивный store для custom-тегов: removeCustomTag меняет state и тригерит
// re-render через useSyncExternalStore — DetailsChips подписан через
// useCustomTagsByProduct. Так можно проверять, что чип реально исчезает из
// DOM после mutation, а не только что mock был вызван.
const { tagsStore, mockRemoveCustomTag } = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  let state: { tag: string }[] = [];
  const snapshotRef = { current: state };
  const set = (next: { tag: string }[]) => {
    state = next;
    snapshotRef.current = state;
    listeners.forEach((l) => l());
  };
  return {
    tagsStore: {
      subscribe: (l: () => void) => {
        listeners.add(l);
        return () => {
          listeners.delete(l);
        };
      },
      // Стабильная getSnapshot — возвращаем сам snapshotRef.current, который
      // меняется только через `set`. Иначе useSyncExternalStore зациклится.
      getSnapshot: () => snapshotRef.current,
      set,
    },
    mockRemoveCustomTag: vi.fn(),
  };
});

vi.mock('@/entities/custom-tag', () => ({
  useCustomTagsByProduct: () => useSyncExternalStore(tagsStore.subscribe, tagsStore.getSnapshot),
  removeCustomTag: (productId: string, tag: string) => {
    mockRemoveCustomTag(productId, tag);
    tagsStore.set(tagsStore.getSnapshot().filter((t) => t.tag !== tag));
    return Promise.resolve();
  },
}));

// Удобный сеттер для тестов (то, что раньше было `mockCustomTags = [...]`).
const setMockCustomTags = (next: { tag: string }[]) => tagsStore.set(next);

vi.mock('@/shared/data/tag-suggestions', () => ({
  getSuggestionsForProduct: (categories: readonly string[]) =>
    categories.includes('meat') ? ['варёное', 'жареное'] : [],
}));

// AutoGrowSearch для теста — простая textarea (упрощает focus/value).
vi.mock('@/shared/ui/atoms/input/AutoGrowSearch', () => ({
  AutoGrowSearch: (props: any) => (
    <textarea
      id={props.id}
      data-testid="details-textarea"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
    />
  ),
}));

// safeMutate — пробрасываем fn() напрямую и возвращаем ok-ветку.
vi.mock('@/shared/lib/safeMutate', () => ({
  safeMutate: async (fn: () => Promise<unknown>) => ({ ok: true, value: await fn() }),
}));

// Удаление тега теперь идёт через переиспользуемый ConfirmDrawer (drawerStore),
// а не window.confirm. Мокаем drawerStore.show — управляем ответом confirm'а per
// test — и глушим сам ConfirmDrawer в null (не тащим DrawerLayout в юнит).
const { mockDrawerShow } = vi.hoisted(() => ({ mockDrawerShow: vi.fn() }));
vi.mock('@/shared/ui', () => ({ drawerStore: { show: mockDrawerShow } }));
vi.mock('@/shared/ui/ConfirmDrawer', () => ({ ConfirmDrawer: () => null }));

const renderChips = (override?: Partial<React.ComponentProps<typeof DetailsChips>>) =>
  render(
    <DetailsChips
      value=""
      onChange={vi.fn()}
      productId="prod-1"
      textareaId="details"
      {...override}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  setMockCustomTags([]);
});

describe('DetailsChips — two-group layout', () => {
  it('рендерит обе группы + подсказку когда есть и built-in, и custom', () => {
    setMockCustomTags([{ tag: 'с лимоном' }]);
    renderChips();

    expect(screen.getByRole('group', { name: 'Особенности' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Ваши теги' })).toBeInTheDocument();
    // The two groups are now divided by the «Ваши теги» QuietLabel heading +
    // .customGroup layout — the old aria-hidden div.separator was dropped in the
    // redesign, so the division is proven by the group + label below, not a rule.
    expect(screen.getByText('Зажмите чтобы удалить')).toBeInTheDocument();
    // Лейбл «Ваши теги» (visible heading, не sr-only) — над второй группой.
    expect(screen.getByText('Ваши теги')).toBeInTheDocument();
  });

  it('без custom-тегов вторая группа и подсказка не рендерятся', () => {
    setMockCustomTags([]);
    renderChips();

    expect(screen.getByRole('group', { name: 'Особенности' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Ваши теги' })).not.toBeInTheDocument();
    expect(screen.queryByText('Зажмите чтобы удалить')).not.toBeInTheDocument();
  });
});

describe('DetailsChips — long-press на custom-чипе', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setMockCustomTags([{ tag: 'с лимоном' }]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const getCustomChip = (): HTMLButtonElement => {
    const group = screen.getByRole('group', { name: 'Ваши теги' });
    const btn = group.querySelector('button');
    if (!btn) throw new Error('No chip in custom group');
    return btn as HTMLButtonElement;
  };

  it('500мс удержания + OK в confirm → вызывает removeCustomTag', async () => {
    mockDrawerShow.mockResolvedValue(true);
    renderChips();

    const chip = getCustomChip();
    fireEvent.pointerDown(chip, { pointerType: 'touch', clientX: 100, clientY: 100 });

    // Под капотом — setTimeout(500ms) → drawerStore.show (async). Прокручиваем
    // таймеры внутри async act, чтобы промис confirm'а + safeMutate доехали.
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(mockDrawerShow).toHaveBeenCalledWith(expect.anything(), {
      title: 'Удалить тег «с лимоном»?',
      confirmLabel: 'Удалить',
      tone: 'danger',
    });
    expect(mockRemoveCustomTag).toHaveBeenCalledWith('prod-1', 'с лимоном');
  });

  it('Cancel в confirm → removeCustomTag НЕ вызывается', async () => {
    mockDrawerShow.mockResolvedValue(false);
    renderChips();

    const chip = getCustomChip();
    fireEvent.pointerDown(chip, { pointerType: 'touch', clientX: 100, clientY: 100 });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(mockRemoveCustomTag).not.toHaveBeenCalled();
  });

  it('быстрый тап (<500мс) → toggle, не удаление', () => {
    mockDrawerShow.mockResolvedValue(true);
    const onChange = vi.fn();
    renderChips({ onChange });

    const chip = getCustomChip();
    fireEvent.pointerDown(chip, { pointerType: 'touch', clientX: 100, clientY: 100 });
    // Только 200мс — не дотягивает до long-press.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.pointerUp(chip);
    fireEvent.click(chip);

    expect(mockDrawerShow).not.toHaveBeenCalled();
    expect(mockRemoveCustomTag).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith('с лимоном'); // toggle добавил тег в details
  });

  // jsdom @25 не определяет глобальный `PointerEvent`, а fireEvent.pointerMove
  // создаёт plain Event без clientX/Y. MouseEvent поддерживает coords и React
  // матчит обработчик по строке типа события ('pointermove'), не по instanceof.
  const firePointerDownAt = (el: Element, x: number, y: number) => {
    el.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }),
    );
  };
  const firePointerMoveAt = (el: Element, x: number, y: number) => {
    el.dispatchEvent(
      new MouseEvent('pointermove', { clientX: x, clientY: y, bubbles: true }),
    );
  };

  it('сдвиг пальца >8px отменяет long-press (скролл-защита)', () => {
    mockDrawerShow.mockResolvedValue(true);
    renderChips();

    const chip = getCustomChip();
    firePointerDownAt(chip, 100, 100);
    firePointerMoveAt(chip, 100, 110); // dy=10 > 8
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(mockDrawerShow).not.toHaveBeenCalled();
    expect(mockRemoveCustomTag).not.toHaveBeenCalled();
  });

  it('сдвиг ≤8px не отменяет long-press (мелкий tremor)', async () => {
    mockDrawerShow.mockResolvedValue(true);
    renderChips();

    const chip = getCustomChip();
    firePointerDownAt(chip, 100, 100);
    firePointerMoveAt(chip, 103, 104); // sqrt(3²+4²)=5 < 8
    // async act: таймер откроет confirm, а флаш промиса/re-render (удаление тега)
    // не протечёт вне act.
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(mockDrawerShow).toHaveBeenCalled();
  });

  it('Cancel в confirm + trailing click → onToggle НЕ срабатывает (firedRef держит подавление)', () => {
    mockDrawerShow.mockResolvedValue(false);
    const onChange = vi.fn();
    renderChips({ onChange });

    const chip = getCustomChip();
    fireEvent.pointerDown(chip, { pointerType: 'touch', clientX: 100, clientY: 100 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    // Имитируем реальный flow iOS: после confirm dismiss приходит pointerUp, потом click.
    fireEvent.pointerUp(chip);
    fireEvent.click(chip);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('OK в confirm → чип исчезает из DOM (store-driven re-render)', async () => {
    mockDrawerShow.mockResolvedValue(true);
    setMockCustomTags([{ tag: 'с лимоном' }, { tag: 'без соли' }]);
    renderChips();

    // Изначально оба чипа на месте.
    const customGroup = () => screen.queryByRole('group', { name: 'Ваши теги' });
    expect(customGroup()?.querySelectorAll('button').length).toBe(2);

    const chip = Array.from(customGroup()!.querySelectorAll('button')).find(
      (b) => b.textContent === 'с лимоном',
    )!;
    fireEvent.pointerDown(chip, { pointerType: 'touch', clientX: 100, clientY: 100 });

    // Async act прокручивает таймер long-press + флашит промис confirm'а и
    // safeMutate, после чего store-driven re-render убирает чип из DOM.
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Чип «с лимоном» исчез, остался только «без соли». Это и есть UI-feedback,
    // который оправдывает «silent delete» (см. feedback_details_chips_silent_delete).
    expect(mockRemoveCustomTag).toHaveBeenCalledWith('prod-1', 'с лимоном');
    const remaining = Array.from(customGroup()!.querySelectorAll('button')).map(
      (b) => b.textContent,
    );
    expect(remaining).toEqual(['без соли']);
  });
});
