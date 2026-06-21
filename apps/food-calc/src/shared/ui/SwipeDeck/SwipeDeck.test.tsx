// @vitest-environment jsdom
// SwipeDeck — общий каркас обвязки многослайдовой страницы.
// Покрываем инварианты, на которых держится рефактор:
//  1. ВСЕ слайды смонтированы одновременно (не условный рендер активного таба) —
//     это и есть механизм «черновик write-bar + скролл переживают переключение
//     раздела» на Discoveries (per-slide state не размонтируется).
//  2. Каждый слайд получает СВОЙ ScreenIndicator (slideIndex 0..N-1) + tablistLabel.
//  3. `data-deck-hero` на контейнере ТОЛЬКО при heroForSlide (гейтит белый watermark).
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { SwipeDeck, type DeckSlide } from './SwipeDeck';
import type { ScreenEntry } from '@/shared/ui/ScreenIndicator';

vi.mock('./SwipeDeck.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `sd-${String(p)}` }),
}));

// Swipeable рендерит children как есть → проверяем, что SwipeDeck отдаёт ему ВСЕ
// слайды (не рендерит активный условно).
vi.mock('@/shared/ui/Swipeable', () => ({
  Swipeable: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swipeable">{children}</div>
  ),
}));

// ScreenIndicator — лёгкий stub, фиксирующий per-slide slideIndex + tablistLabel
// (не тянем SwitcherTab/иконки в тест).
vi.mock('@/shared/ui/ScreenIndicator', () => ({
  ScreenIndicator: ({
    slideIndex,
    tablistLabel,
    screens,
  }: {
    slideIndex: number;
    tablistLabel?: string;
    screens: { label: string }[];
  }) => (
    <div
      data-testid="indicator"
      data-slide={slideIndex}
      data-tablist={tablistLabel ?? ''}
      data-count={screens.length}
    />
  ),
}));

const SCREENS: ScreenEntry[] = [{ label: 'A' }, { label: 'B' }, { label: 'C' }];

const makeSlides = (n: number): DeckSlide[] =>
  Array.from({ length: n }, (_, i) => ({
    render: (topSlot) => (
      <div data-testid={`slide-${i}`}>
        <span data-testid={`topslot-${i}`}>{topSlot}</span>
      </div>
    ),
  }));

const noopBar = () => <div data-testid="topbar" />;

describe('SwipeDeck', () => {
  it('mounts ALL slides simultaneously (per-slide drafts/scroll survive switching)', () => {
    const { getByTestId } = render(
      <SwipeDeck screens={SCREENS} slides={makeSlides(3)} renderTopBar={noopBar} />
    );
    expect(getByTestId('slide-0')).toBeTruthy();
    expect(getByTestId('slide-1')).toBeTruthy();
    expect(getByTestId('slide-2')).toBeTruthy();
  });

  it('feeds each slide its own indicator (slideIndex 0..N-1) + tablistLabel', () => {
    const { getAllByTestId } = render(
      <SwipeDeck
        screens={SCREENS}
        slides={makeSlides(3)}
        renderTopBar={noopBar}
        tablistLabel="Разделы"
      />
    );
    const indicators = getAllByTestId('indicator');
    expect(indicators).toHaveLength(3);
    expect(indicators.map((el) => el.getAttribute('data-slide'))).toEqual(['0', '1', '2']);
    expect(indicators[0].getAttribute('data-tablist')).toBe('Разделы');
  });

  it('sets data-deck-hero (white-watermark gate) ONLY when heroForSlide is given', () => {
    const { container, rerender } = render(
      <SwipeDeck screens={SCREENS} slides={makeSlides(3)} renderTopBar={noopBar} />
    );
    expect(container.querySelector('[data-deck-hero]')).toBeNull();

    rerender(
      <SwipeDeck
        screens={SCREENS}
        slides={makeSlides(3)}
        renderTopBar={noopBar}
        heroForSlide={(i) => <span data-testid={`hero-${i}`} />}
      />
    );
    expect(container.querySelector('[data-deck-hero]')).not.toBeNull();
    expect(container.querySelector('[data-testid="hero-0"]')).not.toBeNull();
  });

  it('renders the floating bar via renderTopBar', () => {
    const { getByTestId } = render(
      <SwipeDeck screens={SCREENS} slides={makeSlides(3)} renderTopBar={noopBar} />
    );
    expect(getByTestId('topbar')).toBeTruthy();
  });
});
