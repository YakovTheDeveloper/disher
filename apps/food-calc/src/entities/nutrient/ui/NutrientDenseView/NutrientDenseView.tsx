import clsx from 'clsx';
import {
  nutrientDisplayGroups,
  type Nutrient,
} from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientGroupTitle } from '@/entities/nutrient/ui/NutrientGroupTitle';
import { useNutrientReadout, type NutrientReadout } from '@/entities/nutrient/model';
import { Text, Numeral, NumeralMarker } from '@/shared/ui/atoms/Typography';
import { formatNutrientMass, formatPctDisplay } from '@/shared/lib/formatNumber';
import s from './NutrientDenseView.module.scss';

type Props = {
  /** Содержание нутриента (обычно скейленное по количеству). */
  getValue: (id: string) => number;
};

// ─── Раскладка «последовательный стек» (2026-07-24, запрос) ────────────────────
// Витрина — вертикальная последовательность, каждый нутриент за другим:
//   Энергия (без подложки и имени, число display + «%» одной строкой)
//   → Белки → Жиры → Углеводы
//   → ряд Клетчатка | Сахар (делят строку пополам)
//   → Вода (без подложки).
// Одна grid-areas сетка на 2 колонки (scss): всё во всю ширину, кроме ряда
// Клетчатка|Сахар, который единственный делится надвое. Область ставится по
// data-nutrient — DOM-порядок остаётся логическим (энергия→Б→Ж→У→клетчатка→сахар→
// вода) для скринридера и клавиатуры.
// Всё прочее (минералы/витамины/амино) — тихий однострочный список.
// Порядок/состав берём из боевого `nutrientDisplayGroups`, не хардкодим набор — только
// имена тиров.
const MACRO_NAMES = ['protein', 'fats', 'carbohydrates'];
const COMPANION_TILE_NAMES = ['fiber', 'sugar']; // делят один ряд пополам

const mainGroup = nutrientDisplayGroups[0];
const byName = (name: string) => mainGroup.content.find((n) => n.name === name) as Nutrient;
const energyNutrient = byName('energy');
const waterNutrient = byName('water');
const macroNutrients: Nutrient[] = MACRO_NAMES.map(byName);
const companionTiles: Nutrient[] = COMPANION_TILE_NAMES.map(byName);
const microGroups = nutrientDisplayGroups.slice(1);

// Число «как в бою» — ЕДИНЫЙ хелпер `formatNutrientMass` (доктрина «не обмануть
// нулём, не шуметь десятыми»; та же формула в NutrientMeterRow — один язык чисел).
const display = (r: NutrientReadout) => formatNutrientMass(r.value, r.unit);

// ─── Атомы ───────────────────────────────────────────────────────────────────
// Метр списка: трек всегда 56px (заливка = доля), поэтому «глючного нуба» при малом
// % нет — видимая дорожка держит присутствие, заливка несёт величину. Ширина от
// `pctRaw` (без округления): след <0.5 % рисует честный срез вместо 0px.
function Bar({ pct }: { pct: number }) {
  return (
    <div className={s.bar}>
      <div className={s.barFill} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function ValueUnit({ r, size = 'md' }: { r: NutrientReadout; size?: 'sm' | 'md' | 'display' }) {
  return (
    <span className={s.valueRow}>
      <Numeral as="span" size={size} weight="semibold">
        {display(r)}
      </Numeral>
      <NumeralMarker kind="unit" className={s.markerData}>
        {r.unit}
      </NumeralMarker>
    </span>
  );
}

// Слот «доля нормы» — ЕДИНЫЙ контракт для всех рядов (плитки/список): пока у нутриента
// есть реальная норма — число «%», иначе тихий плейсхолдер «—». Колонка процента не
// пропадает выборочно (иначе одни ряды с «%», другие без — читалось как глюк/потеря
// данных). Показывается только когда норма вообще задана (гейт `showNorms`).
// Гасится ТОЛЬКО сырой ноль (`pctRaw === 0` ⇔ нутриента нет ⇔ доли нет) через
// `visibility: hidden` (2026-07-23, запрос): hidden, не display:none — геометрия
// ряда (базовая линия, ширины) не прыгает. Любой СЛЕД > 0 остаётся видимым:
// формат `formatPctDisplay` — «<1» ниже 0.5 %, целое выше. Пара с массой
// согласована по построению: «0.4 г · 1 %», а обманчивое «0 г · 1 %»
// конструктивно невозможно (след не обнуляется ни в одном слоте).
// Вес «%» = весу значения (semibold, 2026-07-23): пара «число ↔ его доля нормы» читается
// как ОДНА связка (одно поясняет другое), а не как главное + сноска; ранг задаёт кегль
// (значение md, у энергии display, «%» sm), не вес.
function PctSlot({ r, className }: { r: NutrientReadout; className?: string }) {
  if (!r.hasNorm) {
    return <span className={clsx(className, s.pctDash)}>—</span>;
  }
  return (
    <span className={clsx(className, r.pctRaw === 0 && s.pctHidden)}>
      <Numeral as="span" size="sm" weight="semibold">
        {formatPctDisplay(r.pctRaw)}
      </Numeral>
      <NumeralMarker kind="sign" className={s.markerData}>
        %
      </NumeralMarker>
    </span>
  );
}

// Стат-блок нутриента (БЕЗ рамок, 2026-07-23): имя сверху, значение + «%» на ОДНОЙ
// базовой линии (значение слева, % справа), ниже — метр нормы, чей hue несёт категорию
// (тёплый БЖУ ↔ холодный вторичный, выбирает scss по data-nutrient), а длина — долю.
// Метр по тому же правилу рядов списка: только при реальной норме И value > 0.
// Ширину/место в стеке задаёт grid-area по data-nutrient — сама плитка одинакова для
// БЖУ, клетчатки/сахара (полустрока) и воды (полная строка).
function MacroTile({
  n,
  r,
  showNorms,
  quiet = false,
}: {
  n: Nutrient;
  r: NutrientReadout;
  showNorms: boolean;
  // «Только демоут типографики» для вложенных нутриентов (клетчатка/сахар внутри
  // углеводов): весь блок тише — значение мельче (sm) + вторичный цвет (scss). Хром
  // (guide/бокс/тинт) для вложенности НЕ добавляем — её несёт голос + лёгкий отступ.
  quiet?: boolean;
}) {
  return (
    <div className={clsx(s.macroTile, quiet && s.macroTileQuiet)} data-nutrient={n.name}>
      {/* Имя — semibold (2026-07-23, запрос): подпись нутриента — первичный сканируемый
          якорь плитки, тихий caption-вес тонул рядом с числом. Ранг имени задаёт вес,
          ранг числа — кегль; «%» держится весом значения (связка, см. PctSlot). */}
      <Text as="span" role="caption" weight="semibold" className={s.macroName}>
        {n.displayNameRu}
      </Text>
      <div className={s.macroFigures}>
        <ValueUnit r={r} size={quiet ? 'sm' : 'md'} />
        {showNorms ? <PctSlot r={r} className={s.macroPct} /> : null}
      </div>
      {showNorms && r.hasNorm && r.value > 0 && (
        <div className={s.tileBar} aria-hidden="true">
          <div className={s.tileBarFill} style={{ width: `${Math.min(r.pctRaw, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

// Энергия (2026-07-24, запрос): первой строкой витрины, БЕЗ подложки, но с ИМЕНЕМ
// «Энергия» сверху (как у остальных стат-блоков — запрос вернуть подпись). Отличие от
// макро-плиток лишь в кегле числа (display, задан пропом): значение + «%» на одной
// строке (`.macroFigures`), ниже — метр нормы во всю ширину.
function EnergyCard({
  n,
  r,
  showNorms,
}: {
  n: Nutrient;
  r: NutrientReadout;
  showNorms: boolean;
}) {
  return (
    <div className={s.energyCard} data-nutrient={n.name}>
      <Text as="span" role="caption" weight="semibold" className={s.macroName}>
        {n.displayNameRu}
      </Text>
      <div className={s.macroFigures}>
        <ValueUnit r={r} size="display" />
        {showNorms ? <PctSlot r={r} className={s.macroPct} /> : null}
      </div>
      {showNorms && r.hasNorm && r.value > 0 && (
        <div className={s.tileBar} aria-hidden="true">
          <div className={s.tileBarFill} style={{ width: `${Math.min(r.pctRaw, 100)}%` }} />
        </div>
      )}
    </div>
  );
}

function DenseRow({
  n,
  r,
  showNorms,
  lead = false,
}: {
  n: Nutrient;
  r: NutrientReadout;
  showNorms: boolean;
  lead?: boolean;
}) {
  // Значение/юнит/% — отдельные ячейки грида с ФИКСИРОВАННЫМИ треками: одинаковые у
  // всех рядов ⇒ числа выстраиваются в вертикальные табличные колонки (правое
  // выравнивание + tnum из `Numeral`). Метр — только при реальной норме И value > 0;
  // иначе держим пустой слот, чтобы колонки справа не съезжали.
  const showMeter = r.hasNorm && r.value > 0;
  return (
    <div className={clsx(s.row, lead && s.rowLead, !showNorms && s.rowBare)} data-nutrient={n.name}>
      {/* Имя — semibold: в длинном списке сканируют ИМЕНА, числа читают уже по найденной
          строке; вес имени = весу чисел, ранг держит кегль (body 16 vs sm 13). */}
      <Text as="span" role="body" weight="semibold" className={s.name}>
        {n.displayNameRu}
      </Text>
      {showNorms &&
        (showMeter ? <Bar pct={r.pctRaw} /> : <span className={s.meterEmpty} aria-hidden="true" />)}
      <Numeral as="span" size={lead ? 'md' : 'sm'} weight="semibold" className={s.value}>
        {display(r)}
      </Numeral>
      <NumeralMarker kind="unit" className={clsx(s.unit, s.markerData)}>
        {r.unit}
      </NumeralMarker>
      {showNorms ? <PctSlot r={r} className={s.pct} /> : null}
    </div>
  );
}

/**
 * Плотная витрина нутриентов (2026-07-24 — последовательный стек, запрос): нутриенты
 * идут один за другим сверху вниз — Энергия (без подложки и имени, число display +
 * «%» одной строкой), затем Белки → Жиры → Углеводы, ряд Клетчатка|Сахар пополам и
 * Вода строкой снизу (тоже без подложки). Grid-areas на 2 колонки: всё во всю ширину,
 * кроме одного ряда клетчатка|сахар. Стат-блоки БЕЗ рамок и заливок: рамка «чистого
 * бордера» читалась кнопкой (ложный аффорданс на неинтерактивных данных), а её hue
 * плохо различался — категорию несёт заливка метра нормы (`--sys-color-macro-*`),
 * величину — его длина. Подложек больше нет ни у одной зоны (энергия и вода их
 * лишились по запросу). Всё остальное (минералы/витамины/амино) — ОДИН тихий
 * однострочный список с табличными колонками и hairline-разделителями рядов.
 * Дом — нижний быстрый дровер (QuickViewDrawer). Числа/бары/normglue — те же боевые
 * источники (`useNutrientReadout`, `--sys-color-surface-track/fill`), меняется РАСКЛАДКА.
 *
 * Легенда/контрол нормы (`NormLegendButton`) живёт НЕ здесь, а в ряду базиса дровера
 * (2026-07-24, запрос): чип переехал на место селекта порции (вправо), сам селект —
 * влево. Витрина осталась чистой сеткой без хвоста-легенды; «% — доля дневной нормы»
 * объясняет теперь тот чип наверху.
 *
 * Колонка «% нормы» — ЕДИНЫЙ контракт (`PctSlot`, гейт `showNorms`): либо норма задана и
 * «%»/«—» стоят у КАЖДОГО ряда всех групп, либо не задана и «%» нет ни у кого.
 * Гасится только СЫРОЙ ноль (нет нутриента — нет доли) через `visibility: hidden`;
 * любой след > 0 виден («<1 %» ниже 0.5), пара с массой согласована по построению.
 *
 * Типографическая доктрина (2026-07-23, запрос): ранг задаётся двумя осями — ВЕС для
 * слов (имя нутриента semibold: это первичный сканируемый якорь и плитки, и строки
 * списка) и КЕГЛЬ для чисел. Значение и его «%» — ОДИНАКОВЫЙ вес (semibold): связка
 * «число ↔ его доля нормы», где одно поясняет другое; визуальный ранг внутри связки
 * держит кегль (md/lg у значения, sm у «%»). Маркеры (юнит/знак %) чуть подняты в
 * непрозрачности локально (`.markerData`): «г»/«мг» — данные, не декор.
 */
export function NutrientDenseView({ getValue }: Props) {
  const readout = useNutrientReadout(getValue);
  // Один вью-уровневый гейт для всей колонки процентов: норма задана ⇔ у макросов
  // (у них всегда есть офиц. норма) сработал `hasNorm`. Питает «%»-слоты рядов.
  const showNorms = macroNutrients.some((n) => readout(n.id).hasNorm);
  return (
    <div className={s.root}>
      <section className={s.group}>
        {/* Последовательный стек (grid-areas): энергия строкой сверху, затем Б/Ж/У,
            ряд клетчатка|сахар пополам, вода строкой снизу. */}
        <div className={s.macroGrid}>
          <EnergyCard n={energyNutrient} r={readout(energyNutrient.id)} showNorms={showNorms} />
          {macroNutrients.map((n) => (
            <MacroTile key={n.id} n={n} r={readout(n.id)} showNorms={showNorms} />
          ))}
          {companionTiles.map((n) => (
            <MacroTile key={n.id} n={n} r={readout(n.id)} showNorms={showNorms} quiet />
          ))}
          <MacroTile n={waterNutrient} r={readout(waterNutrient.id)} showNorms={showNorms} />
        </div>
      </section>
      {microGroups.map((group) => (
        <section key={group.name} className={s.group}>
          <NutrientGroupTitle className={s.groupTitle}>{group.displayName}</NutrientGroupTitle>
          <div className={s.list}>
            {group.content.map((n) => (
              <DenseRow key={n.id} n={n} r={readout(n.id)} showNorms={showNorms} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default NutrientDenseView;
