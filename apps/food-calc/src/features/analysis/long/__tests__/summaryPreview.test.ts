import { describe, it, expect } from 'vitest';
import { summaryLead } from '../summaryPreview';

describe('summaryLead', () => {
  it('skips a leading markdown heading and returns the body lead paragraph', () => {
    const md = '## Разбор недели\n\nЗа неделю железо в норме, но витамина D мало. Второе.';
    expect(summaryLead(md)).toBe('За неделю железо в норме, но витамина D мало. Второе.');
  });

  it('strips inline emphasis', () => {
    expect(summaryLead('**Итог:** всё ок.')).toBe('Итог: всё ок.');
  });

  it('unwraps a markdown link to its text', () => {
    expect(summaryLead('Смотри [дефицит](x) внимательно. Ещё.')).toBe(
      'Смотри дефицит внимательно. Ещё.'
    );
  });

  it('does NOT truncate on an abbreviation / unit-with-dot (the whole point)', () => {
    expect(summaryLead('В среднем 80 г. белка в день, это хорошо.')).toBe(
      'В среднем 80 г. белка в день, это хорошо.'
    );
    expect(summaryLead('Железо, витамины и т.д. в норме.')).toBe(
      'Железо, витамины и т.д. в норме.'
    );
  });

  it('handles a summary that is only a heading', () => {
    expect(summaryLead('# Разбор')).toBe('Разбор');
  });

  it('returns empty string for empty input', () => {
    expect(summaryLead('')).toBe('');
  });
});
