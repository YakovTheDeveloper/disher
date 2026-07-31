// Cross-import public API (@x) для слайса food/food-suggest: предложке нужен
// CTA «норма не задана» — готовый чип, открывающий DailyNormModal (мастер-
// опросник внутри). Прямой импорт из соседнего слайса запрещён (steiger,
// fsd/forbidden-imports); @x — канонический обход.
export { NormLegendButton } from '../../../NormLegendButton';
