import type { NutrientTotals } from '@/shared/lib/nutrients';
import s from './NutrientsBar.module.scss';

type Props = {
  totals: NutrientTotals;
  onOpen: () => void;
};

// Сводка нутриентов за день — БЕЗ подложки, тихая (канон 2026-06-18). Тотал —
// приятный бонус, не основа: выровненная колонка «как gofmt» (подписи слева,
// числа справа, единицы строго друг под другом через tnum), прижатая ВПРАВО к
// шеврону. Пустое пространство слева — НАМЕРЕННЫЙ элемент дизайна: узкая колонка
// противопоставлена широким на весь лист строкам расписания. Числа тёмные
// (--color-ink), подписи серые (--text-secondary) — цифра не сливается с
// сокращением. Отделена от еды тающей волосяной бровкой (как `Masthead::after`).
// Весь блок кликабелен → NutrientsDrawer. Облик зафиксирован (design-variants сняты).
const fmt = (v: number | undefined) => (v == null ? '—' : String(Math.round(v)));

export const NutrientsBar = ({ totals, onOpen }: Props) => {
  // Подпись несёт единицу, значение — tnum-цифру. Порядок: Б Ж У Кл Ккал Вода.
  // DOM: подпись → значение (таблица собирается auto-flow'ом grid'а).
  const cells = [
    { key: 'b', label: 'Б', value: fmt(totals['1']) },
    { key: 'f', label: 'Ж', value: fmt(totals['2']) },
    { key: 'c', label: 'У', value: fmt(totals['3']) },
    { key: 'fiber', label: 'Кл', value: fmt(totals['6']) },
    { key: 'kcal', label: 'Ккал', value: fmt(totals['7']) },
    { key: 'water', label: 'Вода', value: fmt(totals['8']) },
  ];

  return (
    <div className={s.root}>
      <button
        type="button"
        className={s.block}
        onClick={onOpen}
        aria-label="Показать все нутриенты за день"
      >
        <div className={s.cells}>
          {cells.map((c) => (
            <span key={c.key} className={s.cell}>
              <span className={s.label}>{c.label}</span>
              <span className={s.value}>{c.value}</span>
            </span>
          ))}
        </div>
        <svg className={s.chevron} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default NutrientsBar;
