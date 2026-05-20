// @vitest-environment jsdom
// OpenDailyNorms — aria-label across variants.
// Card variant отдаёт label через текстовый <span> (название нормы). Icon
// variant — это компактная кнопка-флажок, у неё нет видимого текста,
// поэтому aria-label обязателен. Меняется в зависимости от hasNorm.
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import OpenDailyNorms from './OpenDailyNorms';

const h = vi.hoisted(() => ({ hasNorm: false }));

vi.mock('./OpenDailyNorms.module.scss', () => ({
  default: new Proxy({}, { get: (_t, p: string) => `oda-${String(p)}` }),
}));
vi.mock('@/entities/daily-norm', () => ({
  useHasUserNorm: () => h.hasNorm,
  USER_NORM_NAME: 'Моя норма',
}));
vi.mock('@/shared/ui', () => ({
  modalStore: { show: vi.fn() },
}));
vi.mock('./CreateDailyNormModal', () => ({ default: () => null }));
vi.mock('./EditDailyNormModal', () => ({ default: () => null }));
vi.mock('@/shared/assets/icons/flag.svg?react', () => ({
  default: () => <svg data-testid="flag-icon" />,
}));

describe('OpenDailyNorms — icon variant aria-label', () => {
  it('reads "Настроить дневную норму" when no user norm exists', () => {
    h.hasNorm = false;
    const { container } = render(<OpenDailyNorms variant="icon" />);
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button!.getAttribute('aria-label')).toBe('Настроить дневную норму');
  });

  it('reads "Изменить дневную норму" when user norm is set', () => {
    h.hasNorm = true;
    const { container } = render(<OpenDailyNorms variant="icon" />);
    const button = container.querySelector('button');
    expect(button!.getAttribute('aria-label')).toBe('Изменить дневную норму');
  });

  it('renders the flag icon (shared with NutrientNormDrawerControl)', () => {
    h.hasNorm = false;
    const { queryByTestId } = render(<OpenDailyNorms variant="icon" />);
    expect(queryByTestId('flag-icon')).not.toBeNull();
  });
});

describe('OpenDailyNorms — card variant (default)', () => {
  it('shows the norm name as visible text (no aria-label needed)', () => {
    h.hasNorm = true;
    const { getByText } = render(<OpenDailyNorms />);
    expect(getByText('Моя норма')).not.toBeNull();
  });

  it('shows the "Настроить норму" CTA when no norm exists', () => {
    h.hasNorm = false;
    const { getByText } = render(<OpenDailyNorms />);
    expect(getByText('Настроить норму')).not.toBeNull();
  });
});
