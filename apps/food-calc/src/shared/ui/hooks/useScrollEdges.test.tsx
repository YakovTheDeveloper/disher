import { render, screen, act, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollEdges } from './useScrollEdges';

// Хук вешает IntersectionObserver на сентинелы, вычисляя root от их parentElement,
// поэтому renderHook (без DOM) не годится — рендерим harness, где refs привязаны к
// реальным сиблинг-div'ам под общим родителем-скроллером. Мок IO ловит колбэк
// каждого инстанса + observed-таргеты, чтобы дёргать пересечение вручную.
type MockEntry = { isIntersecting: boolean; target: Element };

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  targets = new Set<Element>();
  constructor(private cb: (entries: MockEntry[], o: unknown) => void) {
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.targets.add(el);
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
  disconnect() {
    this.targets.clear();
  }
  takeRecords() {
    return [];
  }
  fire(target: Element, isIntersecting: boolean) {
    this.cb([{ isIntersecting, target }], this);
  }
}

// Дёрнуть пересечение для сентинела: находим обсервер, который за ним следит.
function fireIntersection(target: Element, isIntersecting: boolean) {
  act(() => {
    for (const inst of MockIntersectionObserver.instances) {
      if (inst.targets.has(target)) inst.fire(target, isIntersecting);
    }
  });
}

function Harness() {
  const { topSentinelRef, bottomSentinelRef, scrolled, moreBelow } = useScrollEdges();
  return (
    <div>
      <div ref={topSentinelRef} data-testid="top" />
      <div ref={bottomSentinelRef} data-testid="bottom" />
      <span data-testid="state">{`${scrolled}|${moreBelow}`}</span>
    </div>
  );
}

const state = () => screen.getByTestId('state').textContent;

afterEach(() => {
  cleanup();
  MockIntersectionObserver.instances = [];
  vi.unstubAllGlobals();
});

describe('useScrollEdges', () => {
  it('без IntersectionObserver (jsdom/SSR) не падает и оставляет края выключенными', () => {
    // Гвард `typeof IntersectionObserver === 'undefined'` — fade прогресс-энхансмент,
    // его отсутствие безопасно. jsdom без IO по умолчанию.
    expect(() => render(<Harness />)).not.toThrow();
    expect(state()).toBe('false|false');
  });

  describe('с IntersectionObserver', () => {
    it('верхний сентинел ушёл из вида → scrolled; вернулся → снят', () => {
      vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
      render(<Harness />);
      const top = screen.getByTestId('top');

      expect(state()).toBe('false|false');

      fireIntersection(top, false); // ушёл за верхнюю кромку → тело прокручено
      expect(state()).toBe('true|false');

      fireIntersection(top, true); // вернулся → у самого верха
      expect(state()).toBe('false|false');
    });

    it('нижний сентинел ушёл из вида → moreBelow; вернулся → снят', () => {
      vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
      render(<Harness />);
      const bottom = screen.getByTestId('bottom');

      fireIntersection(bottom, false); // ниже видимой области есть контент
      expect(state()).toBe('false|true');

      fireIntersection(bottom, true); // докрутили до низа
      expect(state()).toBe('false|false');
    });

    it('верх и низ независимы — один сигнал, но два края', () => {
      vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
      render(<Harness />);
      const top = screen.getByTestId('top');
      const bottom = screen.getByTestId('bottom');

      fireIntersection(top, false);
      fireIntersection(bottom, false);
      expect(state()).toBe('true|true'); // прокручено И есть ещё ниже
    });
  });
});
