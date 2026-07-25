// Витрина нутриентов «Тоталы» (2026-07-25, запрос) — боевой перенос пресета E1 из
// предложки «нутриенты v2» (app/development-features/s_319dd05d): heroSectionVariant
// 'boxes' + cellBorder + hue (normFill=false, track='inCell', header=true). Раскладка
// и классы — со сторибук-виджета, данные — боевые: norm-glue `useNutrientReadout`,
// группы/имена/юниты из `nutrientDisplayGroups`, форматтеры те же, что были у
// фикстуры (`formatNutrientMass`/`formatPctDisplay`). Кегль чисел несут примитивы
// Numeral/NumeralMarker — scss их не трогает, варьируется только раскладка.
import clsx from 'clsx';
import {
  nutrientById,
  nutrientDisplayGroups,
} from '@/entities/nutrient/ui/NutrientGroup/constants';
import { useNutrientReadout, type NutrientReadout } from '@/entities/nutrient/model';
import {
  useNutrientAppearanceStore,
  type NutrientHeroVariant,
  type NutrientTrackVariant,
} from '@/entities/nutrient/model';
import { Text, Numeral, NumeralMarker } from '@/shared/ui/atoms/Typography';
import { Accordion } from '@/shared/ui/Accordion';
import { NutrientAppearanceSettings } from '@/entities/nutrient/ui/NutrientAppearanceSettings';
import { formatNutrientMass, formatPctDisplay } from '@/shared/lib/formatNumber';
import s from './NutrientTotals.module.scss';

type Props = {
  /** Содержание нутриента (обычно скейленное по количеству). */
  getValue: (id: string) => number;
  /**
   * Hero-секция: 'boxes' — ведомость E1 (сетка 3×2), 'circles' — кольца D1,
   * 'raw' — без hero: макро рендерится такой же плотной таблицей, как микро-
   * группы хвоста. Не задан → читается из стора внешнего вида (настройки).
   */
  heroVariant?: NutrientHeroVariant;
  /**
   * Контрол нормы (чип-легенда NormLegendButton) — в ячейке «норма» шапки
   * колонок каждой микро-группы, вместо немой подписи: объяснение «%» сидит
   * ровно над колонкой процентов (2026-07-25, запрос). Слот, а не импорт:
   * витрина — entities, кнопка — features, FSD не пускает наверх.
   */
  normControl?: React.ReactNode;
  /**
   * Правый слот «в т.ч.»-футера (subRow): контрол базиса чисел — селект порции
   * у еды, тихий бейдж у супплемента (2026-07-25, запрос). Кладётся у правой
   * кромке на одной базовой линии с «в т.ч.»-перечнем. Слот, не импорт: витрина
   * — entities, контролы приходят сверху (features не пускает FSD вниз).
   */
  children?: React.ReactNode;
};

// ── Макро-порядок/хью пресета E1 (перенесены из фикстуры предложки, не из боя) ──
// Hero-сетка 3×2: ряд «Энергия · Вода · Клетчатка», ряд «Белки · Жиры · Углеводы».
// Клетчатка поднята в hero-сетку ⇒ в «в т.ч.»-футере остаётся только сахар.
const ENERGY_ID = '7';
const MACRO_E_COLS = [ENERGY_ID, '8', '6', '1', '2', '3'];
const COMPANION_IDS_E = ['4']; // сахар

// D1 «Кольца»: ряд лидеров — энергия (большое кольцо) и вода рядом с ней
// (2026-07-25, запрос), сетка 4 — Б/Ж/У/клетчатка ⇒ «в т.ч.»-футер = сахар.
const WATER_ID = '8';
const MACRO_D_CELLS = ['1', '2', '3', '6']; // белки, жиры, углеводы, клетчатка
const COMPANION_IDS_D = ['4']; // сахар
const RING_CIRCUMFERENCE = 2 * Math.PI * 18;

// data-hue макро-строки → категориальный тон нутриента. У энергии/воды/
// клетчатки/белков hue несёт aurora-свечение (--sys-color-glow-*) + трек/дугу
// близкого средне-глубокого тона (--sys-color-track-*, у белков — macro);
// жиры/углеводы — только macro-трек, без свечения. У хвоста хью нет совсем.
type Hue = 'energy' | 'water' | 'fiber' | 'protein' | 'fat' | 'carb' | 'cool';
const MACRO_HUE: Record<string, Hue> = {
  '7': 'energy',
  '8': 'water',
  '6': 'fiber',
  '1': 'protein',
  '2': 'fat',
  '3': 'carb',
  '4': 'cool',
};

// Ридаут ячейки — боевой NutrientReadout + имя и готовые строки (тот же язык
// чисел, что у остальных витрин: форматтеры общие). Поле процента называется
// `pctText`, чтобы не пересекаться с числовым `pct` ридаута. `subName` — тихая
// подпись полного названия (только у витаминов группы B, см. ниже).
type Cell = NutrientReadout & { name: string; subName?: string; mass: string; pctText: string };

// Витамины B: быстрое имя ряда — «Витамин B1» (читается мгновенно и держит
// ряд одинаковой длины), полное название («Тиамин») уходит в малую подпись
// под ним. A/C/D/E/K уже называются «Витамин X», каротины — не витамины,
// оба случая остаются как есть.
const toCell = (r: NutrientReadout, id: string): Cell => {
  const n = nutrientById[id];
  let name = n?.displayNameRu ?? id;
  let subName: string | undefined;
  if (n?.name.startsWith('vitaminB')) {
    subName = name;
    name = `Витамин ${n.symbol}`;
  }
  return {
    ...r,
    name,
    subName,
    mass: formatNutrientMass(r.value, r.unit),
    pctText: formatPctDisplay(r.pctRaw),
  };
};

// ── Числовые атомы ──────────────────────────────────────────────────────────
// Значение + юнит — ОДНА связка (право-выровнена): «96,0 мкг».
function Mass({ r, size = 'sm' }: { r: Cell; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={s.figure}>
      <Numeral size={size} weight="semibold">
        {r.mass}
      </Numeral>
      <NumeralMarker kind="unit" className={s.mark}>
        {r.unit}
      </NumeralMarker>
    </span>
  );
}

// Доля нормы: число + «%», либо тихое тире, когда нормы нет. Сырой ноль НЕ
// гасится — нулевой ряд приглушается целиком и честно показывает «0 %».
function Pct({
  r,
  size = 'sm',
  className,
}: {
  r: Cell;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  if (!r.hasNorm) {
    return <span className={clsx(className, s.pctDash)}>—</span>;
  }
  return (
    <span className={clsx(className, s.figure)}>
      <Numeral size={size} weight="semibold">
        {r.pctText}
      </Numeral>
      <NumeralMarker kind="sign" className={s.mark}>
        %
      </NumeralMarker>
    </span>
  );
}

// ── Hero E1 «ведомость» ─────────────────────────────────────────────────────
// Ячейка-колонка: имя-шапка, МАССА — герой, % нормы — тихая вторичная строка,
// трек в основании (2026-07-25, переворот иерархии: карточка продукта отвечает
// «что в ней», а не «сколько % дня»; %-первичный язык — для итогов дня).
// Энергия (lead) — типографический якорь зигзага от заголовка дровера: самое
// крупное число сетки + единственный тёплый (янтарный) трек, соло-геометрия
// не нужна — точка входа уже в левом верхнем углу. hue красит трек (data-hue),
// длина = доля нормы. data-hue продублирован на самой ячейке — его подбирают
// aurora-свечения.
// Порог заполнения бара: меньше — fill превращается в пятно-артефакт на
// полном треке («грязь»), честнее тихий пустой рельс + число. Сравнение на
// ОКРУГЛЁННОМ значении — том, что видит глаз в подписи (иначе «3 %» рядом
// с «3 %» даёт разные треки: 3.1 заполнен, 2.9 пуст).
const MIN_BAR_PCT = 3;
function BoxCell({ r, hue, lead = false }: { r: Cell; hue: Hue; lead?: boolean }) {
  const showTrack = r.hasNorm && r.value > 0;
  const showFill = showTrack && Math.round(r.pctRaw) >= MIN_BAR_PCT;
  return (
    <div className={s.eCol} data-hue={hue}>
      <Text as="span" role="caption" weight="semibold" className={s.eName}>
        {r.name}
      </Text>
      <span className={s.eMass}>
        <Mass r={r} size={lead ? 'lg' : 'md'} />
      </span>
      <Pct r={r} size="sm" className={s.ePct} />
      {showTrack ? (
        <span className={s.eBar} data-hue={hue}>
          {showFill ? (
            <span className={s.eBarFill} style={{ width: `${Math.min(r.pctRaw, 100)}%` }} />
          ) : null}
        </span>
      ) : (
        <span className={s.eBarEmpty} aria-hidden="true" />
      )}
    </div>
  );
}

// Обёртка hero-сетки boxes: цветовая айдентика — акварельный wash glow-тоном
// у каждой ячейки (2026-07-25, запрос: оставлен только 'watercolor', вилка
// DesignBar 'NutrientTotalsHero' и форки glow-duet/full-glow/two-realms снесены).
function HeroBoxes({ cell }: { cell: (id: string) => Cell }) {
  return (
    <div className={s.eSheet}>
      {MACRO_E_COLS.map((id) => (
        <BoxCell key={id} r={cell(id)} hue={MACRO_HUE[id]} lead={id === ENERGY_ID} />
      ))}
    </div>
  );
}

// ── Hero D1 «кольца» ─────────────────────────────────────────────────────────
// Кольцо: доля нормы дугой, % числом в центре; hue красит дугу. Дуга рисуется
// только при норме и не ниже визуального порога (иначе 1 % читается точкой-
// артефактом, а не данными — та же доктрина, что MIN_BAR_PCT у boxes).
// Переполнение (>100 %) не клампится молча: после полного витка вторым слоем
// идёт дуга остатка — «полное кольцо» у 100 % и у 203 % различимо формой.
const MIN_ARC_PCT = 3;
function Ring({ r, hue, lead = false }: { r: Cell; hue: Hue; lead?: boolean }) {
  const pct = Math.max(r.pctRaw, 0);
  const showArc = r.hasNorm && r.value > 0 && pct >= MIN_ARC_PCT;
  const overflow = pct > 100;
  return (
    <div className={clsx(s.dRingWrap, lead && s.dRingLead)} data-hue={hue}>
      <svg className={s.dSvg} viewBox="0 0 44 44" aria-hidden="true">
        <circle className={s.dTrack} cx="22" cy="22" r="18" />
        {showArc && (
          <circle
            className={s.dArc}
            cx="22"
            cy="22"
            r="18"
            strokeDasharray={`${(Math.min(pct, 100) / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            transform="rotate(-90 22 22)"
          />
        )}
        {showArc && overflow && (
          <circle
            className={s.dArcOverflow}
            cx="22"
            cy="22"
            r="18"
            strokeDasharray={`${(Math.min(pct - 100, 100) / 100) * RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            transform="rotate(-90 22 22)"
          />
        )}
      </svg>
      <span className={s.dRingCenter}>
        <Pct r={r} size={lead ? 'lg' : 'md'} className={s.dPct} />
      </span>
    </div>
  );
}

// Ячейка-кольцо: lead — ряд лидеров (.dLead с именем и массой рядом с кольцом),
// иначе — клетка сетки (.dCell). Нулевая ячейка приглушается целиком (доктрина
// хвоста): пустое кольцо-призрак с «0 %» — шум, а не данные.
function RoundCell({ r, hue, lead = false }: { r: Cell; hue: Hue; lead?: boolean }) {
  const empty = r.value === 0;
  if (lead) {
    return (
      <div className={clsx(s.dLead, empty && s.dCellEmpty)}>
        <Ring r={r} hue={hue} lead />
        <span className={s.dLeadMeta}>
          <Text as="span" role="body" weight="semibold" className={s.dName}>
            {r.name}
          </Text>
          <span className={s.dLeadMass}>
            <Mass r={r} size="md" />
          </span>
        </span>
      </div>
    );
  }
  return (
    <div className={clsx(s.dCell, empty && s.dCellEmpty)}>
      <Ring r={r} hue={hue} />
      <Text as="span" role="caption" weight="semibold" className={s.dName}>
        {r.name}
      </Text>
      <span className={s.dMass}>
        <Mass r={r} />
      </span>
    </div>
  );
}

// ── Плотный ряд хвоста (cellBorder + track='inCell') ─────────────────────────
// [ИМЯ, 1fr — никогда не схлопывается] [значение+юнит] [ячейка нормы: % + трек у
// низа]. Ячейка норм — настоящая 3-я колонка грида, растянутая на всю высоту
// ряда ⇒ вертикальное правило (normRule) непрерывно само. Трек — только при
// реальной норме И value > 0; нулевой ряд приглушён целиком.
// Положение трека — пользовательская ось (data-track, см. nutrient-appearance-
// store): 'inCell' — рельс в ячейке нормы (база), 'fullWidth' — рельс на всю
// ширину под рядом, 'fill' — фон-заливка карточки (доля нормы в --pct, рисуется
// ::before ряда, .bar не рендерится), 'none' — без трека.
function DenseRow({ r, track }: { r: Cell; track: NutrientTrackVariant }) {
  const empty = r.value === 0;
  const showMeter = r.hasNorm && r.value > 0;
  const showBar = showMeter && (track === 'inCell' || track === 'fullWidth');
  const bar = showBar ? (
    <span className={s.bar} aria-hidden="true">
      <span className={s.barFill} style={{ width: `${Math.min(r.pctRaw, 100)}%` }} />
    </span>
  ) : null;
  return (
    <div
      className={clsx(s.row, s.rowFlat, r.subName != null && s.rowRoomy, empty && s.rowEmpty)}
      data-track={track}
      style={
        track === 'fill' && showMeter
          ? ({ '--pct': `${Math.min(r.pctRaw, 100)}%` } as React.CSSProperties)
          : undefined
      }
    >
      <span className={s.nameCell}>
        <Text as="span" role="body" weight="semibold" className={s.name}>
          {r.name}
        </Text>
        {r.subName != null && (
          <Text as="span" role="caption" className={s.nameSub}>
            {r.subName}
          </Text>
        )}
      </span>
      <span className={s.value}>
        <Mass r={r} />
      </span>
      <span className={clsx(s.norm, s.normRule)}>
        <Pct r={r} className={s.pctFlat} />
        {/* inCell — рельс внутри ячейки нормы (её position:relative задаёт
            отсчёт). fullWidth — рельс рендерится прямым ребёнком ряда ниже:
            внутри 3.5rem-ячейки inset-inline:0 давал бы прежний узкий трек. */}
        {track === 'inCell' ? bar : null}
      </span>
      {track === 'fullWidth' ? bar : null}
    </div>
  );
}

/**
 * Витрина нутриентов быстрого дровера: hero-ведомость макро (6 боксов сеткой
 * 3×2 — Энергия · Вода · Клетчатка / Белки · Жиры · Углеводы, внутренние
 * hairline крестом) + тихий «в т.ч.»-футер (сахар) + ВСЕ микро-группы
 * (`nutrientDisplayGroups.slice(1)` — минералы, витамины, аминокислоты) плотными
 * таблицами: шапка «<группа> | чип нормы» (слот normControl на месте немой
 * подписи «норма») и ряды «имя | значение+юнит | ячейка нормы» со сплошными
 * делителями и вертикальным правилом колонки норм (у шапки правила нет).
 * `heroVariant='circles'` меняет hero на D1-кольца (ряд лидеров энергия+вода,
 * сетка Б/Ж/У/клетчатка, «в т.ч.» = сахар); `heroVariant='raw'` убирает hero и
 * «в т.ч.»-футер — макро-группа рисуется той же плотной таблицей, что и микро.
 * Положение прогресс-трека карточек — из стора внешнего вида (data-track на
 * ряду): 'inCell' (база), 'fullWidth', 'fill', 'none'.
 * Дом — нижний дровер-витрина (NutrientShowcaseDrawer и его обёртки).
 */
export function NutrientTotals({ heroVariant, normControl, getValue, children }: Props) {
  const readout = useNutrientReadout(getValue);
  const cell = (id: string): Cell => toCell(readout(id), id);
  // Дефолт формы — пользовательская настройка (экран «Внешний вид → Нутриенты»);
  // проп heroVariant остаётся явным переопределением для точечных случаев.
  const appearance = useNutrientAppearanceStore();
  const hero = heroVariant ?? appearance.hero;
  const track = appearance.track;
  const circles = hero === 'circles';
  const raw = hero === 'raw';
  return (
    <>
      {raw ? null : circles ? (
        /* Hero D1: ряд лидеров — энергия и вода одинаковыми кольцами по краям
           (2026-07-25, запрос) + сетка кольцевых ячеек Б/Ж/У/клетчатка. */
        <>
          <div className={s.dLeadRow}>
            <RoundCell r={cell(ENERGY_ID)} hue={MACRO_HUE[ENERGY_ID]} lead />
            <RoundCell r={cell(WATER_ID)} hue={MACRO_HUE[WATER_ID]} lead />
          </div>
          <div className={s.dGrid}>
            {MACRO_D_CELLS.map((id) => (
              <RoundCell key={id} r={cell(id)} hue={MACRO_HUE[id]} />
            ))}
          </div>
        </>
      ) : (
        /* Hero: 6 боксов 3×2; энергия — первый бокс (пресет boxes без особой формы). */
        <HeroBoxes cell={cell} />
      )}

      {/* «В т.ч.»-футер: при circles и boxes в hero вся клетчатка ⇒ здесь
          остаётся только сахар; при raw футера нет вовсе (макро — обычная
          группа ниже), остаётся лишь слот контрола базиса (children: селект
          порции / тихий бейдж супплемента). */}
      {!raw || children != null ? (
        <div className={s.subRow}>
          {!raw &&
            (circles ? COMPANION_IDS_D : COMPANION_IDS_E).map((id) => {
              const r = cell(id);
              return (
                <span key={id} className={s.sub}>
                  <Text as="span" role="caption" className={s.subName}>
                    в т.ч. {r.name.toLowerCase()}
                  </Text>
                  <span className={s.subMass}>
                    <Mass r={r} />
                  </span>
                  <Pct r={r} className={s.subPct} />
                </span>
              );
            })}
          {children != null && <span className={s.subControl}>{children}</span>}
        </div>
      ) : null}

      {/* Хвост: микро-группы плотными таблицами (шапка «<группа> | чип нормы»
          и ряды с правилом). При raw к ним присоединяется и макро-группа
          (nutrientDisplayGroups[0]) — hero в этом варианте нет, макро рисуется
          теми же карточками. */}
      {nutrientDisplayGroups.slice(raw ? 0 : 1).map((group) => (
        <section key={group.name} className={s.tailGroup}>
          <div className={s.rowHead}>
            <Text as="span" role="caption" className={s.rowHeadLeft}>
              {group.displayName}
            </Text>
            {/* Ячейка «норма» шапки — живая: вместо немой подписи стоит чип-легенда
                нормы (слот normControl, 2026-07-25). Вертикальное правило у шапки
                снято — бордер остаётся только у рядов. */}
            <span className={s.rowHeadNorm}>{normControl}</span>
          </div>
          <div className={s.list}>
            {group.content.map((n) => (
              <DenseRow key={n.id} r={cell(n.id)} track={track} />
            ))}
          </div>
        </section>
      ))}

      {/* Аккордеон «Оформление» (2026-07-25, запрос) — замыкающая строка
          витрины, шапка прижата вправо. Контент — те же настройки hero/трека,
          что на под-экране «Настройки → Внешний вид → Нутриенты» (общий
          компонент NutrientAppearanceSettings): правка видна на витрине сразу. */}
      <Accordion
        className={s.appearance}
        headerClassName={s.appearanceHeader}
        title={
          <Text as="span" role="caption">
            Оформление
          </Text>
        }
      >
        <NutrientAppearanceSettings />
      </Accordion>
    </>
  );
}

export default NutrientTotals;
