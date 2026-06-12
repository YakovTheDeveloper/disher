import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { usePressFeedback } from '@/shared/lib/hooks/usePressFeedback';
import s from './AnalyzeButton.module.scss';

// DesignBar-перебор «как выглядит главная кнопка экрана Анализа». Anchor отдельный
// от палитры бара (`WriteBar`), чтобы переключался независимо. Набор — на выбор
// юзера (заливка-акцент / ghost-контур / мягкая тонировка / serif-плоская).
const VARIANTS = ['fill', 'ghost', 'tint', 'serif'] as const;

type Props = {
  onClick: () => void;
  disabled?: boolean;
  /** Идёт стриминг разбора — показываем busy-надпись, кнопка заблокирована. */
  busy?: boolean;
};

/**
 * Кнопка «Анализировать» — занимает место поля ввода в баре Анализа (через
 * `WriteBarShell.fieldOverride`). Это и есть первичное действие экрана: инпут
 * убран, уточнение/гипотезы прикладываются через скрепку. Вид перебирается
 * DesignBar-anchor'ом `AnalyzeBtn`.
 */
export const AnalyzeButton = ({ onClick, disabled, busy }: Props) => {
  const { anchor } = useDesignVariant('AnalyzeBtn', VARIANTS);
  const { pressed, pressProps } = usePressFeedback();

  return (
    <button
      {...anchor}
      type="button"
      className={s.analyzeBtn}
      onClick={onClick}
      disabled={disabled || busy}
      data-pressed={pressed || undefined}
      {...pressProps}
    >
      {busy ? 'Анализирую…' : 'Анализировать'}
    </button>
  );
};

export default AnalyzeButton;
