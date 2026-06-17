import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import type { NutrientTotals } from '@/shared/lib/nutrients';
import s from './NutrientsBar.module.scss';

type Props = {
  totals: NutrientTotals;
  onOpen: () => void;
};

// Все варианты — в mono-духе (Ubuntu Mono, капс-подписи, дашборд-читаемость).
// База у всех: full-bleed подложка-градиент серый→белый, без скруглений, край
// в край. Отличаются раскладкой ячеек и стилем кнопки. Флип через
// DesignVariantsBar (anchor 'NutrientsBar', клавиши [ / ]):
//   mono         — ячейки в строку «подпись значение» (дефолт).
//   mono-stack   — подпись над цифрой (мини-стат дашборда), цифры крупнее.
//   mono-divider — ячейки в строку, разделены тонкими вертикальными hairline.
//   mono-boxed   — каждая ячейка в mono-чипе (рамка + радиус), как теги.
const VARIANTS = ['mono', 'mono-stack', 'mono-divider', 'mono-boxed'] as const;

const fmt = (v: number | undefined) => (v == null ? '—' : String(Math.round(v)));

export const NutrientsBar = ({ totals, onOpen }: Props) => {
  const { anchor } = useDesignVariant('NutrientsBar', VARIANTS);
  // Шесть однотипных ячеек: подпись несёт смысл (Ккал/Вода = единица), значение
  // — tnum-цифра. Плоский список → варианты-раскладки ложатся без вложенности.
  const cells = [
    { label: 'Б', value: fmt(totals['1']) },
    { label: 'Ж', value: fmt(totals['2']) },
    { label: 'У', value: fmt(totals['3']) },
    { label: 'Кл', value: fmt(totals['6']) },
    { label: 'Ккал', value: fmt(totals['7']) },
    { label: 'Вода', value: fmt(totals['8']) },
  ];
  return (
    <div className={s.bar} {...anchor}>
      <div className={s.values}>
        {cells.map((c) => (
          <span key={c.label} className={s.pair}>
            <span className={s.label}>{c.label}</span>
            <span className={s.value}>{c.value}</span>
          </span>
        ))}
      </div>
      <button type="button" className={s.button} onClick={onOpen}>
        <span>Показать все</span>
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
