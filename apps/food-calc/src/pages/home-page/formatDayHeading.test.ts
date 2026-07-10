import { describe, it, expect } from 'vitest';
import { formatDayHeading } from './formatDayHeading';

describe('formatDayHeading', () => {
  it('«День недели, число месяц» — родительный падеж месяца, первая буква капсом', () => {
    // 05-07-2026 — воскресенье; месяц в родительном падеже («июля»).
    expect(formatDayHeading('05-07-2026')).toBe('Воскресенье, 5 июля');
  });

  it('не голое имя дня недели — есть число и месяц (guard против отката на EEEE)', () => {
    const label = formatDayHeading('05-07-2026');
    expect(label).toContain('июля');
    expect(label).toMatch(/\d/); // число дня присутствует
  });

  it('null на невалидной дате', () => {
    expect(formatDayHeading('not-a-date')).toBeNull();
  });
});
