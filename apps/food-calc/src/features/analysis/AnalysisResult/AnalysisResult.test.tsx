import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import AnalysisResult from './AnalysisResult';
import type { AnalysisInsight } from '../api';

const INSIGHT: AnalysisInsight = {
  title: 'Меньше сахара — ровнее энергия',
  detail: 'В дни с низким сахаром меньше спадов.',
  valence: 'positive',
  strength: 'moderate',
  evidence: { days: [] },
};

// Regression (2026-06-22): разбор блюда (sheet-режим, не bare) озаглавливает
// pearl-плашку через `sheetHeader`. Раньше AnalysisResult слал в SheetCard `''`
// во все секции → SheetCard рисовал ПУСТОЙ header-блок (guard `header != null`
// пропускает ''). Фикс: `header={sheetHeader || undefined}` + DishAnalysisScreen
// передаёт "Результат". SheetCard header = <Heading role="headline"> → <h2>;
// заголовки карточек инсайтов = <Heading role="title" as="h3"> → <h3>, поэтому
// уровень заголовка различает «шапку плашки» и «тайтл карточки».
describe('AnalysisResult — sheet header (разбор блюда)', () => {
  it('рендерит sheetHeader как заголовок плашки в sheet-режиме', () => {
    render(
      <AnalysisResult
        summary=""
        observations={[]}
        insights={[INSIGHT]}
        hypotheses={[]}
        sheetHeader="Результат"
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Результат' }),
    ).toBeInTheDocument();
  });

  it('НЕ рисует header-блок, когда sheetHeader не передан (нет пустого h2)', () => {
    render(
      <AnalysisResult
        summary=""
        observations={[]}
        insights={[INSIGHT]}
        hypotheses={[]}
      />,
    );
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });
});
