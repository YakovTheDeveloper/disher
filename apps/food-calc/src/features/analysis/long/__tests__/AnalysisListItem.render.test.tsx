import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnalysisListItem from '../AnalysisListItem';
import { STALE_PENDING_MS, type Analysis } from '../../api';

// Рендер-контракт карточки по 4 статусам (deriveStatus покрыт отдельно): что ложится
// в тело и когда показывается пилюля «идёт». `createdAt` управляет running↔stale.
function mk(over: Partial<Analysis>): Analysis {
  return {
    id: 'a-1',
    windowStart: '2026-05-01T00:00:00Z',
    windowEnd: '2026-05-08T00:00:00Z',
    summary: '',
    observations: [],
    insights: [],
    hypotheses: [],
    appliedHypotheses: [],
    createdAt: new Date().toISOString(),
    ...over,
  };
}

const noop = () => {};

describe('AnalysisListItem render', () => {
  it('done: тело = лид-абзац summary, пилюли «идёт» НЕТ, data-status=done', () => {
    const { container } = render(
      <AnalysisListItem
        analysis={mk({ summary: 'За неделю всё стабильно. Детали ниже.' })}
        onOpen={noop}
      />
    );
    const li = container.querySelector('li') as HTMLLIElement;

    expect(li.getAttribute('data-status')).toBe('done');
    expect(li.textContent).toContain('За неделю всё стабильно. Детали ниже.');
    expect(li.textContent).not.toContain('идёт');
  });

  it('running: тело = плейсхолдер «Разбор идёт…», пилюля «идёт» + пульс-точка есть', () => {
    const { container } = render(
      <AnalysisListItem analysis={mk({ summary: '' })} onOpen={noop} />
    );
    const li = container.querySelector('li') as HTMLLIElement;

    expect(li.getAttribute('data-status')).toBe('running');
    expect(li.textContent).toContain('Разбор идёт…');
    // Пилюля «идёт» присутствует (последнее «идёт» — в трейлинг-слоте).
    expect(li.textContent).toContain('идёт');
    // Пульс-точка (aria-hidden span) отрисована.
    expect(li.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('failed: тело = «Разбор не удался», пилюли НЕТ, data-status=failed (accent-полоска несёт статус)', () => {
    const { container } = render(
      <AnalysisListItem
        analysis={mk({ summary: '⚠️ Анализ не удался: bad-output' })}
        onOpen={noop}
      />
    );
    const li = container.querySelector('li') as HTMLLIElement;

    expect(li.getAttribute('data-status')).toBe('failed');
    expect(li.textContent).toContain('Разбор не удался');
    // Нет пульс-точки → нет running-пилюли.
    expect(li.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('stale: тело = плейсхолдер-подсказка, пилюли НЕТ, data-status=stale', () => {
    const { container } = render(
      <AnalysisListItem
        analysis={mk({
          summary: '',
          createdAt: new Date(Date.now() - STALE_PENDING_MS - 60_000).toISOString(),
        })}
        onOpen={noop}
      />
    );
    const li = container.querySelector('li') as HTMLLIElement;

    expect(li.getAttribute('data-status')).toBe('stale');
    expect(li.textContent).toContain('Возможно, не удалось');
    expect(li.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
