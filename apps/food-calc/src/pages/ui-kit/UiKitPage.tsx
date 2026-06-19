import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';

import { useSurface, type Surface } from '@/shared/lib/surface';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import {
  modalStore,
  drawerStore,
  ModalShell,
  ModalNextButton,
  type BaseDrawerProps,
} from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { Heading, Text, Typography } from '@/shared/ui/atoms/Typography';
import Button from '@/shared/ui/atoms/Button/Button';
import BackButton from '@/shared/ui/atoms/Button/BackButton/BackButton';
import { QuietActionButton } from '@/shared/ui/atoms/Button/QuietActionButton';
import SuggestActionButton from '@/shared/ui/SuggestActionButton/SuggestActionButton';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import { NutrientsSummaryButton } from '@/shared/ui/AppBottomBar/NutrientsSummaryButton';
import NumberInput from '@/shared/ui/atoms/input/NumberInput/NumberInput';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch/AutoGrowSearch';
import { Select } from '@/shared/ui/atoms/Select/Select';
import { Chip } from '@/shared/ui/atoms/Chip/Chip';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import LabeledCheckbox from '@/shared/ui/LabeledCheckbox/LabeledCheckbox';
import Tabs from '@/shared/ui/Tabs/Tabs';
import Breadcrumbs from '@/shared/ui/Breadcrumbs/Breadcrumbs';
import ScreenLabel from '@/shared/ui/atoms/Typography/ScreenLabel/ScreenLabel';
import FoodName from '@/shared/ui/atoms/Typography/FoodName/FoodName';
import Quantity from '@/shared/ui/Quantity/Quantity';
import { ChangeHighlight } from '@/shared/ui/ChangeHighlight';
import { NavTile } from '@/shared/ui/NavTile';
import { ScreenIndicator } from '@/shared/ui/ScreenIndicator';
import { ScrollIndicator } from '@/shared/ui/ScrollIndicator';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { PopoverTrigger } from '@/shared/ui/popover/PopoverTrigger';

// ─── Widgets ─────────────────────────────────────────────────────────────────
import { ScheduleFoodItem } from '@/widgets/FoodSchedule/ScheduleFoodItem';
import { ScheduleEventCard } from '@/widgets/ScheduleEvents/components/ScheduleEventCard';
import { NutrientsBar } from '@/widgets/FoodSchedule/NutrientsBar';
import { FoodsNutrients } from '@/widgets/nutrients/FoodsNutrients';
import { NutrientsDrawer } from '@/widgets/nutrients/NutrientsDrawer';
import { HomeTopBar } from '@/widgets/HomeTopBar';

// ─── Features ────────────────────────────────────────────────────────────────
import { FoodActionCard } from '@/features/food/food-search/food-action-card';
import { ProductQuantity } from '@/features/product/ProductQuantity';
import { FoodPortionsManager } from '@/features/food/food-portions-manager';
import {
  LongPressRow,
  ROW_BOUNDARY_KEY,
  ROW_BOUNDARY_VARIANTS,
} from '@/features/shared/long-press-item';
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer';
import { AnalysisCtaButton } from '@/features/analysis/AnalysisCtaButton';
import { AnalysisKindDrawer } from '@/features/analysis/AnalysisKindDrawer';
import { DailyNormDrawer } from '@/features/dailyNorms/DailyNormDrawer';
import { DailyNormButton } from '@/features/dailyNorms/DailyNormButton/DailyNormButton';
import { ProductDrawer } from '@/features/food/product-drawer';
import { NutrientPickerDrawer } from '@/features/food/food-search/NutrientPickerDrawer';
import { ScheduleNavigatorDrawer } from '@/features/schedule-navigator';
import { ProfileDrawer } from '@/features/auth/ProfileDrawer';

// Imported only to render ONE real local one-off button live in the debt catalog
// (the «Мои открытия» pill from HomePage screen 1). pages → widgets is a legal
// FSD import; this reuses the button's own styles instead of re-deriving them.
import labStyles from '@/widgets/Laboratory/Laboratory.module.scss';
import ListIcon from '@/shared/assets/icons/list.svg?react';

import {
  DEMO_DATE,
  CATALOG,
  DEMO_TOTALS,
  DEMO_SCHEDULE_FOODS,
  DEMO_EVENTS,
  DEMO_FOOD_CARDS,
  DEMO_PORTIONS,
  DEMO_IMPLICIT_PORTION,
} from './fixtures';

import s from './UiKitPage.module.scss';

// ─── Small inline icon (Button `before` / `icon` slot demo) ─────────────────
const PlusGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// ─── Section registry ────────────────────────────────────────────────────────
// Single source of truth for both the nav rail and the content order, so they
// can never drift apart. `id` anchors the section element + the scroll-spy.
// (The old standalone «Анатомия» section was dissolved 2026-06-19 — each entity's
// reasoned breakdown now lives inline inside the section that shows it.)
const SECTIONS = [
  { id: 'typography', index: '01', title: 'Типографика' },
  { id: 'buttons', index: '02', title: 'Кнопки' },
  { id: 'inputs', index: '03', title: 'Поля ввода' },
  { id: 'selection', index: '04', title: 'Выбор и навигация' },
  { id: 'lists', index: '05', title: 'Списки и индикаторы' },
  { id: 'feedback', index: '06', title: 'Обратная связь' },
  { id: 'overlays', index: '07', title: 'Оверлеи' },
  { id: 'widgets', index: '08', title: 'Виджеты' },
  { id: 'features', index: '09', title: 'Фичи' },
  { id: 'drawers', index: '10', title: 'Дроверы и модалки' },
] as const;

// ─── Anatomy registry (the reasoned breakdowns, now inline per-section) ───────
// Each large semantic entity decomposed into primitives, with the WHY of every
// visual choice grounded in real CSS + intent comments, then a critique +
// improvement. Raskraska = hand snapshot of the CSS on 2026-06-19 (not auto-linked
// to source — on drift, read the component's own `.module.scss`). Each block is
// rendered inside its matching section via <AnatomyBlock>. Prose source of truth:
// tds/semantic-roles.md.
type AnatomyPart = { part: string; role: string; css: string; why: string; smell?: boolean };
type AnatomyEntity = {
  id: string;
  title: string;
  intro?: string;
  win?: boolean;
  parts: AnatomyPart[];
  critique: string;
  improve: string;
};

const ANATOMY: AnatomyEntity[] = [
  {
    id: 'an-segment',
    title: 'Сегмент-выбор (один из нескольких)',
    intro:
      'Одна семантика — два разных визуальных языка в проекте. Это корень ощущения «бардака».',
    parts: [
      {
        part: 'Tabs — активный (визард)',
        role: 'шаг, на котором ты сейчас',
        css: 'заливка #111, белый CAPS-текст 11px, weight 600',
        why: 'press-канон «заливка ink + инверсия»; максимальный контраст',
      },
      {
        part: 'Tabs — неактивный',
        role: 'доступный, не выбранный',
        css: 'прозрачный фон, opacity 0.6, CAPS',
        why: 'приглушён контрастом, НЕ курсивом',
      },
      {
        part: 'NavTile — активная плитка (дефолт)',
        role: 'выбранный раздел (плиточный режим)',
        css: 'белая «бумага» + 2-слойная тень, serif italic, opacity 0.92',
        why: '«inverse-lift»: активный выпуклый',
      },
      {
        part: 'NavSwitcher tab-as-title — активный (прод HomePage)',
        role: 'активный ПОГЛОЩАЕТ роль заголовка слайда',
        css: 'sans-bold 38px (Onest, голос Masthead), opacity 1',
        why: 'активный = буквально заголовок (ВАШ пример); тот же sans-голос, что у Masthead',
      },
      {
        part: 'NavSwitcher tab-as-title — неактивный',
        role: 'тихий указатель «вы здесь»',
        css: 'serif italic 15px, opacity 0.22',
        why: 'курсив = интерактивность; полупрозрачность = не перетягивать внимание (ВАША модель — точно)',
      },
    ],
    critique:
      'Ваша гипотеза (активный = заголовок, неактивный = полупрозрачный курсив) — это ИМЕННО вариант NavSwitcher tab-as-title, и она точна. Но: (1) компонент Tabs устроен иначе — CAPS + чёрная заливка, без курсива → два разных языка для «выбери один из N»; (2) активный-заголовок в tab-as-title использует sans-bold голос Masthead — тот самый конфликт serif ↔ sans, что в находке про заголовки.',
    improve:
      'Выбрать один канон сегмент-выбора, либо явно развести роли: Tabs = «шаги визарда», NavSwitcher tab-as-title = «разделы дома» — и записать. Заодно решить голос активного-заголовка (serif Heading ↔ sans Masthead).',
  },
  {
    id: 'an-button',
    title: 'Кнопка действия',
    intro:
      'После ревизии 2026-06-19 у Button осталось 4 живых варианта (было 11): primary, ghost, '
      + 'bottomActionBar, brand. Семь мёртвых (secondary, tertiary, danger, filter, filter-2, menu, '
      + 'primary-form) удалены — именно они и были «именами-по-виду».',
    parts: [
      {
        part: 'primary',
        role: 'главное действие формы / подтверждения',
        css: 'width:100%, фон --color-blue-2, белый текст',
        why: 'заливка-акцент = «это основной путь»',
      },
      {
        part: 'brand',
        role: 'фирменная CTA (единый цвет primary-действий)',
        css: 'pill, sage-жёлтый градиент --cta-brand-fill, ink-текст',
        why: 'один брендовый цвет на проект; перекрашивается одним градиентом',
      },
      {
        part: 'bottomActionBar',
        role: 'действие нижнего дока',
        css: 'стеклянная pill, peach-rose окаёмка (mask-ring), без тени',
        why: 'единый вид действий в нижнем баре; объём держит окаёмка, не lift',
      },
      {
        part: 'press-отклик (все варианты)',
        role: 'тактильный ответ на нажатие',
        css: 'заливка ink + инверсия текста + scale 0.96–0.97',
        why: 'код: «сплошную нечем залить — затемняем фильтром»; «цветной отклик заменяет opacity»',
      },
      {
        part: 'ghost',
        role: 'тихая текст-ссылка / отмена',
        css: 'курсив, weight 200, подчёркнут, серый',
        why: 'минимальный вес = «это ссылка, не кнопка-действие»',
      },
    ],
    critique:
      'Было 11 вариантов: половина названа по смыслу (primary / danger / ghost), половина — по виду или месту (filter-2, menu, brand, bottomActionBar, primary-form). Имя-по-виду и есть двигатель разрастания. Семь вариантов с нулём боевых использований снесены; brand и bottomActionBar оставлены осознанно — это места (бар, CTA), а не вид.',
    improve:
      'Если линейка снова разрастётся — свести к осям: intent (primary / quiet / danger) × size × context (флаг «в баре»). Тихие текст-действия уже вынесены в отдельный примитив QuietActionButton — не плодить их как варианты Button.',
  },
  {
    id: 'an-field',
    title: 'Поле ввода',
    intro:
      'После ревизии 2026-06-19 у NumberInput сняты мёртвые декоративные пропсы (color, '
      + 'variant=underline, bottom, boxShadow, size=small) — в бою жили только value/onChange/'
      + 'min/maxLength + size=big.',
    parts: [
      {
        part: 'shell (пилюля)',
        role: 'поверхность поля',
        css: 'тёплый 3-stop градиент, radius 24px, через --field-bg-*',
        why: 'не плоско (stripe-fork прав. 1); токены объявлены выше → предок переопределяет тон',
      },
      {
        part: 'fading hairline (::after)',
        role: 'разделитель снизу',
        css: 'тающая линия 1px, прозрачная по краям',
        why: 'тающая линия, а не рамка (stripe-fork прав. 2) — мягче «коробки»',
      },
      {
        part: 'placeholder-accent',
        role: 'первое слово плейсхолдера',
        css: 'serif italic, weight 500',
        why: 'serif-акцент намекает на «тему» поля',
      },
      {
        part: 'NumberInput',
        role: 'числовое поле (количество / норма)',
        css: 'центр, tnum, фокус-ring синий; size=big — крупнее',
        why: 'отдельный примитив с numeric-клавиатурой и draft-стейтом (пустая строка ≠ 0)',
        smell: true,
      },
    ],
    critique:
      'AutoGrowSearch / Select / LabeledCheckbox делят ОДНУ систему --field-* (один тон) — это win. NumberInput по-прежнему выпадает: сырые #ccc / #0070f3 на фокусе, не --field-* токены. Числовое поле звучит из другой системы (но мёртвые «underline/grey/white»-скины уже сняты — расхождение сузилось до одного focus-ring).',
    improve: 'Перевести NumberInput на --field-* токены (фон + focus-ring), чтобы все поля говорили одним голосом.',
  },
  {
    id: 'an-label',
    title: 'Метка поля',
    parts: [
      {
        part: 'label',
        role: 'подпись к контролу / секции',
        css: 'serif italic, weight 400, size --heading-size-field, opacity 0.72',
        why: 'код: «тихая подпись, а не жирный микро-капс (канон против label-as-placeholder)»',
      },
      {
        part: 'hint-суффикс',
        role: 'уточнение справа',
        css: 'opacity 0.6, через « · »',
        why: 'ещё тише — это второстепенно',
      },
    ],
    critique:
      '~11 мест в features рисуют свой .fieldLabel / .sectionLabel вместо FieldLabel — расходятся вес, цвет, курсив.',
    improve: 'Заменить на FieldLabel; новые .*Label-классы ловить на ревью / линтом.',
  },
  {
    id: 'an-heading',
    title: 'Заголовок',
    parts: [
      {
        part: 'Heading (канон)',
        role: 'заголовок экрана / оверлея',
        css: 'Source Serif italic (Alice), размеры по роли',
        why: 'единый «голос» — роднит с навигационным band',
      },
      {
        part: 'Masthead',
        role: 'слайд-заголовок (дом)',
        css: 'Apple sans-bold 32px, НЕ курсив',
        why: 'намеренно «Apple Large Title» — другой голос',
        smell: true,
      },
      {
        part: 'Typography feature-title / ScreenLabel',
        role: 'декор / watermark',
        css: 'serif 90px / opacity 0.03 caps',
        why: 'декоративный, не заголовок',
      },
    ],
    critique:
      'Текст-заголовки рисуют 5 сущностей, и два голоса конфликтуют: serif-italic (Heading) ↔ sans-bold (Masthead). Глаз не понимает, «что главнее».',
    improve:
      'Решить: один голос ИЛИ две явные роли (display-serif vs slide-sans) — и зафиксировать, какую где применять.',
  },
  {
    id: 'an-card',
    title: 'Карточка-поверхность',
    parts: [
      {
        part: 'SheetCard',
        role: 'карточка-лист (контент-секция)',
        css: 'плоская, gloss-слой ::before, БЕЗ тени',
        why: 'код: «лежит на бумаге, без подъёма»',
      },
      {
        part: 'NavTile',
        role: 'плитка-навигация',
        css: 'приподнятая, 2-слойная тень (active)',
        why: 'inverse-lift: выбранное «выступает»',
      },
      {
        part: 'Analysis .card',
        role: 'feature-карточка',
        css: 'свои --ax-* токены (hairline / rail / inset)',
        why: 'третья философия карточки',
        smell: true,
      },
    ],
    critique:
      'Три разных представления о том, что такое «карточка»: плоская-бумага, приподнятая и feature-локальная.',
    improve:
      'Назвать роли явно: «карточка-лист» (SheetCard) для секций, «плитка» (NavTile) для выбора; Analysis-карточки свести к SheetCard или осознанно выделить третью роль.',
  },
  {
    id: 'an-row',
    title: 'Строка списка (stripe-fork)',
    win: true,
    intro: 'Пример того, как ДОЛЖНА выглядеть консистентность — этот канон не ломать.',
    parts: [
      {
        part: 'inner surface',
        role: 'тело строки',
        css: 'TOD-градиент (color-mix по времени дня)',
        why: 'не плоско; тон = время суток',
      },
      {
        part: 'левый акцент-stripe',
        role: 'статус / категория',
        css: '3px покой → 5px активна, цвет несёт данные',
        why: 'stripe-fork прав. 3: вертикальный акцент несёт смысл',
      },
      {
        part: 'fading hairline снизу',
        role: 'разделитель',
        css: 'тающая линия',
        why: 'не рамка вокруг строки',
      },
      {
        part: 'press / focus',
        role: 'отклик',
        css: 'заливка --_tapped + scale 0.98; focus: outline 2px + ring',
        why: 'тот же press-канон, что у кнопок',
      },
    ],
    critique:
      'Это уже консистентный канон — хвалю. Мелочь: HypothesisListItem повторяет stripe-fork руками вместо общего примитива строки.',
    improve: 'Вынести stripe-fork-строку в один примитив, чтобы её не копировали по месту.',
  },
];

const ANATOMY_BY_ID = Object.fromEntries(ANATOMY.map((e) => [e.id, e])) as Record<
  string,
  AnatomyEntity
>;

// ─── Local one-off buttons — the debt catalog (§02) ───────────────────────────
// ~40+ buttons across the app are hand-built locally with their own `.xxxBtn`
// class instead of a shared variant. THIS is why Button's secondary/tertiary had
// 0 uses (the white-outline secondary is re-drawn per place — see discoveriesBtn).
// These rows are the notable unification candidates (debt map, no refactor here).
type LocalButton = { cls: string; where: string; does: string; shouldBe: string };
const LOCAL_BUTTONS: LocalButton[] = [
  {
    cls: 'discoveriesBtn',
    where: 'Laboratory (экран 1)',
    does: 'white-outline pill «Мои открытия» → /discoveries',
    shouldBe: 'вторичная CTA (Button variant secondary — был, снесён за 0 использований)',
  },
  {
    cls: 'bannerButton',
    where: 'DailyAnalysisSection',
    does: 'повтор после ошибки разбора дня',
    shouldBe: 'вторичная кнопка',
  },
  {
    cls: 'runButton / rerunButton',
    where: 'DishAnalysisScreen',
    does: 'запустить / перезапустить разбор блюда',
    shouldBe: 'Button primary / brand',
  },
  {
    cls: 'submitBtn',
    where: 'AuthForm, CheckInboxView',
    does: 'отправка формы авторизации',
    shouldBe: 'Button primary',
  },
  {
    cls: 'switchBtn',
    where: 'AuthForm, CheckInboxView',
    does: 'переключить логин ↔ регистрация',
    shouldBe: 'Button ghost (текст-ссылка)',
  },
  {
    cls: 'backBtn / backButton',
    where: 'AuthForm, ModalHeader, Edit/CreateDailyNormModal',
    does: 'назад',
    shouldBe: 'BackButton (shared-примитив уже существует!)',
  },
  {
    cls: 'closeButton',
    where: 'CreateLongAnalysisModal, AnalysisDetailModal',
    does: 'закрыть × модалку',
    shouldBe: 'единый close-× примитив',
  },
  {
    cls: 'topupBtn',
    where: 'BalanceSection',
    does: 'пополнить баланс (пока disabled)',
    shouldBe: 'Button primary',
  },
  {
    cls: 'commitBtn / cancelBtn',
    where: 'InlineWriteFoodReview',
    does: 'подтвердить / отменить разбор',
    shouldBe: 'Button primary / ghost',
  },
  {
    cls: 'readyCta',
    where: 'WriteFoodInput',
    does: '«смотреть результат» после разбора',
    shouldBe: 'Button brand / primary CTA',
  },
];

// ─── Showcase layout primitives ─────────────────────────────────────────────
function Section({
  id,
  index,
  title,
  desc,
  children,
}: {
  id: string;
  index: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={s.section}>
      <div className={s.sectionHead}>
        <span className={s.sectionIndex}>{index}</span>
        <Heading size="section" as="h2" className={s.sectionTitle}>
          {title}
        </Heading>
        {desc && <p className={s.sectionDesc}>{desc}</p>}
      </div>
      <div className={s.grid}>{children}</div>
    </section>
  );
}

/**
 * A single labelled component sample. `name` is the code caption; `note` a short
 * mono hint; `role` the plain-language label the user asked for — что это · роль ·
 * где используется · зачем такой вид (sans, on its own line). Sizing: default =
 * one grid cell; `wide` = two cells; `full` = the whole row.
 */
function Specimen({
  name,
  note,
  role,
  wide,
  full,
  children,
}: {
  name: string;
  note?: string;
  role?: React.ReactNode;
  wide?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <figure className={clsx(s.specimen, wide && s.specimenWide, full && s.specimenFull)}>
      <div className={s.specimenStage}>{children}</div>
      <figcaption className={s.specimenLabel}>
        <span className={s.specimenName}>{name}</span>
        {note && <span className={s.specimenNote}>{note}</span>}
        {role && <span className={s.specimenRole}>{role}</span>}
      </figcaption>
    </figure>
  );
}

/**
 * The reasoned breakdown of one entity (parts table + critique + improvement),
 * rendered inline inside its section's specimen grid (spans the full row). This
 * is the dissolved «Анатомия» section, redistributed per-component.
 */
function AnatomyBlock({ e }: { e: AnatomyEntity }) {
  if (!e) return null;
  return (
    <article className={clsx(s.anatomyEntity, s.anatomyInline, e.win && s.anatomyEntityWin)}>
      <div className={s.anatomyHead}>
        <Heading size="drawer" as="h3" className={s.anatomyTitle}>
          {e.title}
        </Heading>
        <span className={s.anatomyTag}>{e.win ? 'консистентно' : 'разбор'}</span>
      </div>
      {e.intro && <p className={s.anatomyIntro}>{e.intro}</p>}

      <div className={s.anatomyTableWrap}>
        <table className={s.anatomyTable}>
          <thead>
            <tr>
              <th>Примитив</th>
              <th>Роль</th>
              <th>Раскраска (факт)</th>
              <th>Обоснование выбора</th>
            </tr>
          </thead>
          <tbody>
            {e.parts.map((p) => (
              <tr key={p.part} className={p.smell ? s.anatomySmellRow : undefined}>
                <td className={s.anatomyPart}>{p.part}</td>
                <td>{p.role}</td>
                <td className={s.anatomyCss}>{p.css}</td>
                <td className={s.anatomyWhy}>
                  {p.smell && <span className={s.anatomySmellTag}>запах</span>}
                  {p.why}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={s.anatomyNotes}>
        <p className={s.anatomyCritique}>
          <span className={s.anatomyNoteLabel}>Критика</span>
          {e.critique}
        </p>
        <p className={s.anatomyImprove}>
          <span className={s.anatomyNoteLabel}>Улучшение</span>
          {e.improve}
        </p>
      </div>
    </article>
  );
}

/**
 * Debt catalog of local one-off buttons (§02). Renders the canonical example live
 * (discoveriesBtn from HomePage screen 1, reusing its own styles) + a table of the
 * notable hand-built buttons and the shared primitive each should reuse instead.
 */
function LocalButtonsBlock() {
  return (
    <article className={clsx(s.anatomyEntity, s.anatomyInline)}>
      <div className={s.anatomyHead}>
        <Heading size="drawer" as="h3" className={s.anatomyTitle}>
          Локальные одноразовые кнопки
        </Heading>
        <span className={s.anatomyTag}>долг</span>
      </div>
      <p className={s.anatomyIntro}>
        Эти кнопки сверстаны на месте своим классом (<code>.xxxBtn</code>), а не общим вариантом
        Button — таких по проекту ~40+. Именно поэтому у Button варианты secondary / tertiary имели
        ноль использований: вторичную кнопку рисуют локально. Живой пример — «Мои открытия» с экрана
        1 (Laboratory): плоская белая pill с ink-обводкой — буквально «вторичная рядом с залитой
        CTA».
      </p>
      <div className={s.localLiveRow}>
        <button
          type="button"
          className={labStyles.discoveriesBtn}
          onClick={() => toast('→ /discoveries')}
        >
          <ListIcon width={18} height={18} />
          Мои открытия
        </button>
      </div>

      <div className={s.anatomyTableWrap}>
        <table className={s.anatomyTable}>
          <thead>
            <tr>
              <th>Класс</th>
              <th>Где</th>
              <th>Что делает</th>
              <th>Должен переиспользовать</th>
            </tr>
          </thead>
          <tbody>
            {LOCAL_BUTTONS.map((b) => (
              <tr key={b.cls} className={s.anatomySmellRow}>
                <td className={s.anatomyPart}>{b.cls}</td>
                <td className={s.anatomyCss}>{b.where}</td>
                <td>{b.does}</td>
                <td className={s.anatomyWhy}>
                  <span className={s.anatomySmellTag}>дубль</span>
                  {b.shouldBe}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={s.anatomyNotes}>
        <p className={s.anatomyCritique}>
          <span className={s.anatomyNoteLabel}>Критика</span>В таблице — заметные кандидаты на
          унификацию (вторичные / первичные CTA, «назад», close-×). Ещё ~30 одноразовых — это
          icon-утилиты (<code>infoBtn</code>, <code>clearButton</code>, <code>multiplierBtn</code>,
          <code>thumbBtn</code>…), часть из них легитимно локальные.
        </p>
        <p className={s.anatomyImprove}>
          <span className={s.anatomyNoteLabel}>Улучшение</span>Вернуть один shared-вариант
          white-outline secondary (или сделать discoveriesBtn примитивом) и перевести на него
          вторичные CTA; <code>backBtn</code>-места — на существующий BackButton; close-× свести к
          одному примитиву. Тогда у Button снова появятся боевые secondary, а локальный разнобой
          схлопнется.
        </p>
      </div>
    </article>
  );
}

/** Scaffolding trigger — opens an overlay / fires a toast in the gallery. NOT a
 *  kit specimen; styled distinctly (accent-tint pill) to read as a dev control. */
function DemoButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className={s.demoBtn} onClick={onClick}>
      {children}
    </button>
  );
}

// ─── Interactive overlay demo (opened through the real drawer store) ─────────
function DemoDrawer({ onClose }: BaseDrawerProps) {
  return (
    <DrawerLayout
      a11yLabel="Демонстрация Drawer"
      footer={
        <Button variant="primary" center onClick={() => onClose()}>
          Закрыть
        </Button>
      }
    >
      <div className={s.overlayBody}>
        <Heading size="drawer">Drawer</Heading>
        <Text variant="hint">
          DrawerLayout — каркас нижней или боковой панели: drag-handle, крестик, скролл-зона и
          закреплённый <code>footer</code>. Открывается через <code>drawerStore.show()</code>.
        </Text>
        <Typography variant="info">
          Боковой вариант открывается с опцией <code>{`{ side: 'right', width }`}</code>.
        </Typography>
      </div>
    </DrawerLayout>
  );
}

// ─── Static config ───────────────────────────────────────────────────────────
const TAB_OPTIONS = [
  { value: 'overview', alternativeLabel: 'Обзор' },
  { value: 'details', alternativeLabel: 'Детали' },
  { value: 'history', alternativeLabel: 'История', disabled: true, disabledLabel: 'Скоро' },
] as const;

type BcStep = 'food' | 'time' | 'qty';
const BC_STEPS: BcStep[] = ['food', 'time', 'qty'];
const BC_LABELS: Record<BcStep, string> = { food: 'Продукт', time: 'Время', qty: 'Порция' };
const BC_RESULTS: Record<BcStep, string> = { food: 'Овсянка', time: '08:30', qty: '120 г' };

const SCREEN_TILES = [{ label: 'Дом' }, { label: 'Блюда' }, { label: 'Норма' }];

const SELECT_OPTIONS = [
  { value: 'day', label: 'За день' },
  { value: 'week', label: 'По неделям' },
  { value: 'month', label: 'За месяц' },
];

// Same key + tuple as FoodSchedule so the row palette here is the REAL one and
// the floating DesignBar flips it (the schedule rows read CSS off this
// `[data-dv='ScheduleFood'][data-dv-v]` ancestor attribute). Mirrors the inline
// list in FoodSchedule.tsx — keep in sync if that canon changes.
const FOOD_DV_VARIANTS = [
  'meadow',
  'sunrise',
  'sorbet',
  'garden',
  'lagoon',
  'tropic',
  'twilight',
  'plain',
  'lime',
  'lemon',
] as const;

// ─── Page ────────────────────────────────────────────────────────────────────
const UiKitPage = () => {
  const [surface, setSurface] = useState<Surface>('lavender');
  useSurface(surface);

  // Real design-variant anchors for the schedule-row specimens (section 08), so
  // they render in their actual palette (lemon/TOD) and the DesignBar can flip
  // them — instead of falling back to base styling. Food rows read the
  // `ScheduleFood` palette anchor; the boundary anchor (shared with food+events)
  // drives the adjacent-row edge treatment.
  const { anchor: foodAnchor } = useDesignVariant('ScheduleFood', FOOD_DV_VARIANTS);
  // Two boundary anchors (one per specimen) mirrors prod, where FoodSchedule and
  // ScheduleEvents each register this same key from their own component — each
  // anchor's ref binds exactly one DOM node.
  const { anchor: boundaryAnchor } = useDesignVariant(ROW_BOUNDARY_KEY, ROW_BOUNDARY_VARIANTS);
  const { anchor: boundaryAnchorEvents } = useDesignVariant(
    ROW_BOUNDARY_KEY,
    ROW_BOUNDARY_VARIANTS,
  );

  // Legacy dev previewer of the warm/lavender surface axis (retired in prod —
  // the app tone now comes from the ModalShell variant). Suppress the global
  // `data-modal-fields` tone while this page is mounted so the surface toggle
  // above stays authoritative here; restore it on unmount.
  useEffect(() => {
    const body = document.body;
    const prev = body.getAttribute('data-modal-fields');
    body.removeAttribute('data-modal-fields');
    return () => {
      if (prev !== null) body.setAttribute('data-modal-fields', prev);
    };
  }, []);

  // ── Scroll-spy: highlight the nav item of the section nearest the top of the
  // content scroller. The scroller is THIS page's own element (we don't wrap in
  // <Screen>), so the IntersectionObserver root is that ref directly.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const els = SECTIONS.map((sec) => document.getElementById(sec.id)).filter(
      (el): el is HTMLElement => el != null,
    );
    const io = new IntersectionObserver(
      (entries) => {
        // The topmost section currently crossing the spy band (top ~10–30% of
        // the viewport) wins. Sorting by viewport-top keeps it stable when two
        // short sections sit in the band at once.
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActiveId(top.target.id);
      },
      { root, rootMargin: '-10% 0px -70% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));

    // Bottom fallback: a section shorter than the spy band sitting at the very
    // bottom never crosses it, so the nav would never highlight it. When the
    // scroller reaches the end, force the last section active.
    const onScroll = () => {
      if (root.scrollTop + root.clientHeight >= root.scrollHeight - 4) {
        setActiveId(SECTIONS[SECTIONS.length - 1].id);
      }
    };
    root.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      io.disconnect();
      root.removeEventListener('scroll', onScroll);
    };
  }, []);

  const goToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // local interactive state
  const [num1, setNum1] = useState(50);
  const [num2, setNum2] = useState(250);
  const [num3, setNum3] = useState(7);
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [selectValue, setSelectValue] = useState('day');
  const [activeChips, setActiveChips] = useState<Record<string, boolean>>({ keto: true });
  const [checkA, setCheckA] = useState(true);
  const [checkB, setCheckB] = useState(false);
  const [tab, setTab] = useState<string>('overview');
  const [bcStep, setBcStep] = useState<BcStep>('time');
  const [screenIdx, setScreenIdx] = useState(0);
  const [chKey, setChKey] = useState(0);

  // ModalShell demo — rendered fullscreen through ModalByLabel, exactly how it
  // lives in production (it is the modal surface, not a card inside a dialog).
  const [shellOpen, setShellOpen] = useState(false);
  const [shellQty, setShellQty] = useState(120);

  const toggleChip = (key: string) =>
    setActiveChips((prev) => ({ ...prev, [key]: !prev[key] }));

  const openConfirm = async (tone: 'default' | 'danger') => {
    const ok = await modalStore.show(ConfirmModal, {
      title: tone === 'danger' ? 'Удалить продукт?' : 'Сохранить изменения?',
      message:
        tone === 'danger'
          ? 'Действие необратимо — продукт исчезнет из всех расписаний.'
          : 'Новые значения нутриентов будут применены ко всем блюдам.',
      confirmLabel: tone === 'danger' ? 'Удалить' : 'Сохранить',
      cancelLabel: 'Отмена',
      tone,
    });
    toast(ok ? 'Подтверждено' : 'Отменено');
  };

  return (
    <>
      <div className={s.page}>
        {/* ── Left nav rail (Storybook-style) ── */}
        <aside className={s.rail}>
          <div className={s.railHead}>
            <Heading size="drawer" as="h1" className={s.railBrand}>
              UI Kit
            </Heading>
            <Text variant="hint">Живая витрина общих компонентов Disher</Text>
          </div>

          <div className={s.surfaceToggle} role="group" aria-label="Surface-палитра">
            {(['warm', 'lavender'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                className={
                  surface === opt ? `${s.surfaceBtn} ${s.surfaceBtnActive}` : s.surfaceBtn
                }
                onClick={() => setSurface(opt)}
                aria-pressed={surface === opt}
              >
                {opt}
              </button>
            ))}
          </div>

          <nav className={s.nav} aria-label="Разделы">
            {SECTIONS.map((sec) => (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className={clsx(s.navItem, activeId === sec.id && s.navItemActive)}
                aria-current={activeId === sec.id ? 'true' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  goToSection(sec.id);
                }}
              >
                <span className={s.navIndex}>{sec.index}</span>
                <span className={s.navLabel}>{sec.title}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* ── Content scroller (own scroll root → drives the scroll-spy) ── */}
        <div className={s.scroll} ref={scrollRef}>
          <main className={s.sections}>
            {/* ── 01 Typography ── */}
            <Section
              id="typography"
              index="01"
              title="Типографика"
              desc="Источник правды для заголовков и текста. Heading — italic-serif канон, Text — тело. Внизу — разбор ролей «Заголовок» и «Метка поля»."
            >
              <Specimen name="<Heading>" note="size: screen · modal · modalSub · drawer · section" wide>
                <div className={s.stack}>
                  <Heading size="screen">Screen 40px</Heading>
                  <Heading size="modal">Modal 32px</Heading>
                  <Heading size="modalSub">ModalSub (Alice)</Heading>
                  <Heading size="drawer">Drawer 24px</Heading>
                  <Heading size="section">Section</Heading>
                </div>
              </Specimen>

              <Specimen
                name="<Text variant='hint'>"
                role={<>Роль: спокойная подсказка. Где: под полем, под заголовком оверлея. Зачем: тише тела — это пояснение, не контент.</>}
              >
                <Text variant="hint">Спокойная подсказка под полем или заголовком оверлея.</Text>
              </Specimen>

              <Specimen name="<Typography>" note="action · info · elegant · feature-title*">
                <div className={s.stack}>
                  <Typography variant="action">action — акцентное действие</Typography>
                  <Typography variant="info">info — второстепенная информация</Typography>
                  <Typography variant="elegant">elegant — тонкая подача</Typography>
                  <Typography variant="feature-title">feature-title</Typography>
                  <Typography variant="feature-title-s">feature-title-s</Typography>
                </div>
              </Specimen>

              <Specimen
                name="<ScreenLabel>"
                note="variant=screenHeader · known-issue: ScreenLabel рендерит div-в-p, показан 1 вариант"
              >
                <ScreenLabel variant="screenHeader">screenHeader</ScreenLabel>
              </Specimen>

              <Specimen name="<FoodName>" note="анимация смены значения">
                <div className={s.stack}>
                  <FoodName content={{ name: 'Овсянка на молоке' }} />
                  <FoodName content={null} />
                </div>
              </Specimen>

              <Specimen name="<Quantity>">
                <Quantity id="demo-qty" onClick={() => {}} content={{ quantity: 150 }} hide={false} unit="г" />
              </Specimen>

              <Specimen name="<ChangeHighlight>" note="sweep-подсветка при смене trigger">
                <div className={s.stack}>
                  <ChangeHighlight trigger={chKey} variant="sweep">
                    <span className={s.bigNum}>{120 + chKey * 5} г</span>
                  </ChangeHighlight>
                  <DemoButton onClick={() => setChKey((k) => k + 1)}>Изменить</DemoButton>
                </div>
              </Specimen>

              <AnatomyBlock e={ANATOMY_BY_ID['an-heading']} />
              <AnatomyBlock e={ANATOMY_BY_ID['an-label']} />
            </Section>

            {/* ── 02 Buttons ── */}
            <Section
              id="buttons"
              index="02"
              title="Кнопки"
              desc="После ревизии 2026-06-19: у Button осталось 4 живых варианта (было 11). Рядом — остальные кнопки-примитивы, у каждой подписана роль, где используется и зачем такой вид. Внизу — разбор «Кнопка действия»."
            >
              <Specimen
                name='<Button variant="primary">'
                role={<><b>Что:</b> залитая кнопка во всю ширину. <b>Роль:</b> главное действие формы / подтверждения. <b>Где:</b> SuggestNutrientsConfirmDrawer («Продолжить»), AttachHypothesesPicker. <b>Зачем:</b> заливка-акцент = основной путь.</>}
              >
                <Button variant="primary">Подтвердить</Button>
              </Specimen>

              <Specimen
                name='<Button variant="ghost">'
                role={<><b>Что:</b> подчёркнутый серый курсив, без подложки. <b>Роль:</b> тихая текст-ссылка / отмена. <b>Где:</b> SuggestNutrientsConfirmDrawer («Отмена»), footer ModalShell. <b>Зачем:</b> минимальный вес — это ссылка, не действие.</>}
              >
                <Button variant="ghost">Отмена</Button>
              </Specimen>

              <Specimen
                name='<Button variant="brand">'
                role={<><b>Что:</b> pill с фирменным sage-жёлтым градиентом. <b>Роль:</b> фирменная CTA — единый цвет primary-действий проекта. <b>Где:</b> AnalysisCtaButton. <b>Зачем:</b> один брендовый цвет, перекрашивается одним градиентом.</>}
              >
                <Button variant="brand" icon={<PlusGlyph />}>
                  Разобрать день
                </Button>
              </Specimen>

              <Specimen
                name='<Button variant="bottomActionBar">'
                note="peach-rose окаёмка · стекло"
                role={<><b>Что:</b> стеклянная pill с градиентной окаёмкой. <b>Роль:</b> действие нижнего дока. <b>Где:</b> AnalysesSlide, EditDailyNormModal. <b>Зачем:</b> единый вид действий в нижнем баре.</>}
                wide
              >
                <Button variant="bottomActionBar" icon={<PlusGlyph />}>
                  Добавить
                </Button>
                <Button variant="bottomActionBar">Без иконки</Button>
              </Specimen>

              <Specimen
                name="<Button>"
                note="состояния"
                role={<><b>Роль:</b> состояния любого варианта — <code>isLoading</code> (блокирует + «Loading…»), <code>disabled</code>, ведущий значок через <code>before</code> / <code>icon</code>.</>}
              >
                <Button variant="primary" isLoading>
                  loading
                </Button>
                <Button variant="primary" disabled>
                  disabled
                </Button>
                <Button variant="brand" before={<PlusGlyph />}>
                  before
                </Button>
              </Specimen>

              <Specimen
                name="<BackButton>"
                role={<><b>Что:</b> ‹-стрелка. <b>Роль:</b> единый жест «назад» на весь app. <b>Где:</b> HomeTopBar.backSlot (продукт / блюдо), AnalysesTopBar, шапки оверлеев (SearchFood). <b>Зачем:</b> одна аффорданс-стрелка вместо разнобоя; <code>to</code> = push-навигация, <code>onClick</code> = шаг оверлея.</>}
              >
                <div className={s.darkStage}>
                  <BackButton onClick={() => toast('назад')} />
                </div>
              </Specimen>

              <Specimen
                name="<QuietActionButton>"
                role={<><b>Что:</b> значок + label, без подложки, приглушённый текст. <b>Роль:</b> тихая текст-кнопка-примитив. <b>Где:</b> база для SuggestActionButton и DailyNormButton. <b>Зачем:</b> владеет только видом — значок / текст / действие задаёт консумер (не плодить такие как варианты Button).</>}
              >
                <QuietActionButton
                  label="Тихое действие"
                  icon={<PlusGlyph />}
                  onClick={() => toast('quiet action')}
                />
              </Specimen>

              <Specimen
                name="<SuggestActionButton>"
                role={<><b>Что:</b> sparkle + label (обёртка над QuietActionButton). <b>Роль:</b> семантическая «предложка». <b>Где:</b> Screen.headerAction — DishPage «Предложить ингредиенты», ProductPage «Предложить нутриенты». <b>Зачем:</b> единый вид AI-предложений.</>}
              >
                <SuggestActionButton label="Предложить нутриенты" onClick={() => toast('предложить')} />
              </Specimen>

              <Specimen
                name="<DailyNormButton>"
                role={<><b>Что:</b> текст + флажок справа (обёртка над QuietActionButton). <b>Роль:</b> кнопка дневной нормы, текст по состоянию. <b>Где:</b> вверху FoodsNutrients и в hero продукта. <b>Зачем:</b> по клику открывает DailyNormDrawer.</>}
              >
                <DailyNormButton />
              </Specimen>

              <Specimen
                name="<ModalNextButton>"
                note="next · finish"
                role={<><b>Что:</b> label + стрелка / галочка. <b>Роль:</b> primary Confirm в footer’е модалок (right-слот ModalShell.ActionButtons). <b>Где:</b> все пошаговые модалки. <b>Зачем:</b> «Далее» (стрелка) vs «Готово» (галка) — один примитив для обоих.</>}
                wide
              >
                <ModalNextButton onClick={() => toast('далее')} variant="next" />
                <ModalNextButton onClick={() => toast('готово')} variant="finish" />
              </Specimen>

              <Specimen
                name="<NutrientsSummaryButton>"
                note="ведущий слот AppBottomBar"
                role={<><b>Что:</b> 2-строчная серая сводка Б·Ж·У·клетчатка + ккал/вода. <b>Роль:</b> кнопка-сводка дня. <b>Где:</b> левый слот нижнего бара экрана еды. <b>Зачем:</b> тап открывает разбор нутриентов; единый приглушённый серый, без цветных цифр.</>}
                wide
              >
                <NutrientsSummaryButton totals={DEMO_TOTALS} onClick={() => toast('нутриенты')} />
              </Specimen>

              <Specimen
                name="<AppBottomBarShell>"
                note="side=split · chrome-only"
                role={<><b>Что:</b> каркас нижнего дока без собственной поверхности (фон — Screen-scrim). <b>Роль:</b> раскладка CTA нижнего бара. <b>Где:</b> слайды без 3-слотового food-дока (ScheduleEvents, Laboratory). <b>Зачем:</b> <code>side</code> = left / right / split, <code>tone</code> = default / lemon / paper.</>}
                full
              >
                <AppBottomBarShell side="split">
                  <Button variant="bottomActionBar" icon={<PlusGlyph />}>
                    Добавить
                  </Button>
                  <Button variant="brand">Разобрать</Button>
                </AppBottomBarShell>
              </Specimen>

              <AnatomyBlock e={ANATOMY_BY_ID['an-button']} />
              <LocalButtonsBlock />
            </Section>

            {/* ── 03 Inputs ── */}
            <Section
              id="inputs"
              index="03"
              title="Поля ввода"
              desc="Числовое поле, авто-растущий текст и Select. Реагируют на surface-палитру. После ревизии 2026-06-19 у NumberInput сняты мёртвые декоративные пропсы. Внизу — разбор «Поле ввода»."
            >
              <Specimen
                name="<NumberInput>"
                note="size=big · min · maxLength"
                role={<><b>Что:</b> числовое поле с numeric-клавиатурой и draft-стейтом (пустая строка ≠ 0). <b>Роль:</b> ввод количества / нормы. <b>Где:</b> ProductQuantity, NutrientTable, инлайн-правка строки, порции. <b>Зачем:</b> <code>{'size="big"'}</code> — крупный hero-вариант (порции).</>}
                wide
              >
                <NumberInput value={num1} onChange={setNum1} maxLength={4} />
                <NumberInput value={num2} onChange={setNum2} size="big" maxLength={4} />
                <NumberInput value={num3} onChange={setNum3} maxLength={3} />
              </Specimen>

              <Specimen
                name="<AutoGrowSearch>"
                note="многострочное поле-заметка"
                role={<><b>Что:</b> textarea, растущая по мере ввода (тёплая pill, --field-* токены). <b>Роль:</b> свободный текст / заметка. <b>Где:</b> write-бары, поля заметок. <b>Зачем:</b> единый текст-примитив; <code>maxRows</code> ограничивает рост.</>}
                wide
              >
                <AutoGrowSearch
                  value={note}
                  onChange={setNote}
                  placeholder="Заметка, растёт по мере ввода…"
                  maxRows={5}
                />
              </Specimen>

              <Specimen
                name="<AutoGrowSearch singleLine>"
                note="имя/тег + адорнменты"
                role={<><b>Что:</b> то же поле в одну строку (Enter не переносит). <b>Роль:</b> имя / тег. <b>Где:</b> ChangeNameModal, создание продукта. <b>Зачем:</b> <code>singleLine</code> + <code>startAdornment</code> / <code>endAdornment</code> для значков.</>}
                wide
              >
                <AutoGrowSearch
                  value={name}
                  onChange={setName}
                  singleLine
                  placeholder="Название продукта"
                  startAdornment={<PlusGlyph />}
                />
              </Specimen>

              <Specimen
                name="<Select>"
                note="Base UI · --field-* тон"
                role={<><b>Что:</b> тонкая обёртка над Base UI Select (та же библиотека, что Drawer/Dialog). <b>Роль:</b> выбор одного из списка. <b>Где:</b> поля выбора в модалках. <b>Зачем:</b> тема через --field-* токены доезжает и в портал попапа.</>}
              >
                <Select
                  value={selectValue}
                  options={SELECT_OPTIONS}
                  onChange={setSelectValue}
                  ariaLabel="Период разбора"
                />
              </Specimen>

              <AnatomyBlock e={ANATOMY_BY_ID['an-field']} />
            </Section>

            {/* ── 04 Selection & navigation ── */}
            <Section
              id="selection"
              index="04"
              title="Выбор и навигация"
              desc="Чипы, чекбоксы, табы, крошки и плитки навигации. Внизу — разбор «Сегмент-выбор»: почему «выбери один из N» звучит двумя разными языками."
            >
              <Specimen name="<Chip active>" note="презентационный — toggle на стороне вызова">
                {[
                  { key: 'keto', label: 'Кето' },
                  { key: 'vegan', label: 'Веган' },
                  { key: 'gf', label: 'Без глютена' },
                ].map((c) => (
                  <Chip key={c.key} active={!!activeChips[c.key]} onClick={() => toggleChip(c.key)}>
                    {c.label}
                  </Chip>
                ))}
              </Specimen>

              <Specimen name="<LabeledCheckbox>" note="checked · disabled">
                <div className={s.stack}>
                  <LabeledCheckbox id="ck-a" checked={checkA} onChange={setCheckA} label="Учитывать в норме" />
                  <LabeledCheckbox id="ck-b" checked={checkB} onChange={setCheckB} label="Только избранное" />
                  <LabeledCheckbox id="ck-c" checked onChange={() => {}} disabled label="Заблокировано" />
                </div>
              </Specimen>

              <Specimen name="<Tabs>" note="disabled-таб + disabledLabel" wide>
                <Tabs tabs={[...TAB_OPTIONS]} current={tab} setTab={setTab} />
              </Specimen>

              <Specimen name="<Breadcrumbs>" note="шаги визарда с результатами" wide>
                <Breadcrumbs
                  steps={BC_STEPS}
                  current={bcStep}
                  stepLabels={BC_LABELS}
                  stepResults={BC_RESULTS}
                  onStepClick={setBcStep}
                />
              </Specimen>

              <Specimen name="<NavTile>" note="квадратная плитка · active · solidLabel">
                <div className={s.navTileGrid}>
                  <NavTile label="Дом" active />
                  <NavTile label="Блюда" />
                  <NavTile label="Норма" />
                </div>
              </Specimen>

              <Specimen name="<ScreenIndicator>" note="ряд NavTile (+ опц. слот заголовка)" full>
                <ScreenIndicator
                  screens={SCREEN_TILES}
                  activeIndex={screenIdx}
                  onSelect={setScreenIdx}
                  bandImg={false}
                />
              </Specimen>

              <AnatomyBlock e={ANATOMY_BY_ID['an-segment']} />
            </Section>

            {/* ── 05 Lists & indicators ── */}
            <Section id="lists" index="05" title="Списки и индикаторы" desc="Обёртка списка с пустым состоянием и индикатор скролла.">
              <Specimen name="<ItemsList>" note="ul-обёртка списка">
                <ItemsList>
                  <li className={s.demoLi}>Овсянка — 120 г</li>
                  <li className={s.demoLi}>Яйцо — 2 шт</li>
                  <li className={s.demoLi}>Кофе — 200 мл</li>
                </ItemsList>
              </Specimen>

              <Specimen name="<ItemsList count={0}>" note="пустое состояние (placeholder-строки)">
                <ItemsList count={0}>{null}</ItemsList>
              </Specimen>

              <Specimen name="<ScrollIndicator>" note="visible · variant">
                <div className={s.scrollIndBox}>
                  <ScrollIndicator visible variant="dark" />
                </div>
              </Specimen>
            </Section>

            {/* ── 06 Feedback ── */}
            <Section id="feedback" index="06" title="Обратная связь" desc="Загрузка и тосты (sonner, смонтирован глобально).">
              <Specimen name="<Spinner>" note="size · color">
                <Spinner />
                <Spinner size={28} color="#7c6fae" />
              </Specimen>

              <Specimen name="toast()" note="sonner · 5 типов · кнопки — dev-триггеры" wide>
                <DemoButton onClick={() => toast('Обычное уведомление')}>default</DemoButton>
                <DemoButton onClick={() => toast.success('Сохранено')}>success</DemoButton>
                <DemoButton onClick={() => toast.error('Что-то пошло не так')}>error</DemoButton>
                <DemoButton onClick={() => toast.info('Просто к сведению')}>info</DemoButton>
                <DemoButton onClick={() => toast.warning('Будьте внимательны')}>warning</DemoButton>
              </Specimen>
            </Section>

            {/* ── 07 Overlays ── */}
            <Section
              id="overlays"
              index="07"
              title="Оверлеи"
              desc="Модалки/дроверы/поповеры. Результат возвращается промисом / стейтом. Кнопки «Открыть» — dev-триггеры (sage-пилюли), а не часть кита."
            >
              <Specimen name="ConfirmModal" note="modalStore.show → boolean">
                <DemoButton onClick={() => openConfirm('default')}>Подтверждение</DemoButton>
                <DemoButton onClick={() => openConfirm('danger')}>Опасное действие</DemoButton>
              </Specimen>

              <Specimen name="ModalShell" note="fullscreen каркас (ModalByLabel) — как в проде">
                <DemoButton onClick={() => setShellOpen(true)}>Открыть ModalShell</DemoButton>
              </Specimen>

              <Specimen name="<PopoverTrigger>" note="floating-ui поповер">
                <PopoverTrigger
                  trigger={<DemoButton onClick={() => {}}>Открыть popover</DemoButton>}
                  content={
                    <div className={s.popoverCard}>
                      <Text variant="hint">Контент живёт во floating-портале и закрывается по клику вне.</Text>
                    </div>
                  }
                />
              </Specimen>

              <Specimen name="DrawerLayout" note="bottom · side">
                <DemoButton onClick={() => drawerStore.show(DemoDrawer, {})}>Нижний drawer</DemoButton>
                <DemoButton
                  onClick={() =>
                    drawerStore.show(DemoDrawer, {}, { side: 'right', width: 'min(88vw, 380px)' })
                  }
                >
                  Боковой drawer
                </DemoButton>
              </Specimen>
            </Section>

            {/* ── 08 Widgets ── */}
            <Section
              id="widgets"
              index="08"
              title="Виджеты"
              desc="Боевые строки и сводки на фейковых пропсах (Dexie не трогаем). FoodSchedule/ScheduleEvents — это целые экраны, поэтому показаны их строительные блоки: строки, бары, верхняя обвязка. Внизу — разбор строки (stripe-fork) как образец консистентности."
            >
              <Specimen
                name="<ScheduleFoodItem>"
                note="строка еды — палитра по DesignBar (как в проде) · продукт · вода · блюдо · своя добавка"
                full
              >
                {/* Real anchors: food rows read palette off [data-dv='ScheduleFood'],
                    boundary anchor drives the adjacent-row edge — same wrapping as
                    FoodSchedule. */}
                <div {...foodAnchor}>
                  <div {...boundaryAnchor}>
                    <div className={s.rowStack}>
                      {DEMO_SCHEDULE_FOODS.map((item, i) => (
                        <ScheduleFoodItem
                          key={item.id}
                          item={item}
                          index={i}
                          totalCount={DEMO_SCHEDULE_FOODS.length}
                          onLongPress={() => toast('long-press → ItemActionsDrawer')}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Specimen>

              <Specimen name="<ScheduleEventCard>" note="строка события (lemon вшит) — scale/tag/relation чипы" full>
                {/* Events have no palette anchor (lemon baked-in 2026-06-13); they
                    still consume the shared boundary anchor for the edge treatment. */}
                <div {...boundaryAnchorEvents}>
                  <div className={s.rowStack}>
                    {DEMO_EVENTS.map((item, i) => (
                      <ScheduleEventCard
                        key={item.id}
                        item={item}
                        index={i}
                        totalCount={DEMO_EVENTS.length}
                        onLongPress={() => toast('long-press → действия')}
                        onEditTime={() => toast('править время')}
                        onEditText={() => toast('править текст')}
                        onEditAtoms={() => toast('править данные')}
                      />
                    ))}
                  </div>
                </div>
              </Specimen>

              <Specimen name="<NutrientsBar>" note="тихая сводка дня → NutrientsDrawer" full>
                <NutrientsBar
                  totals={DEMO_TOTALS}
                  onOpen={() =>
                    drawerStore.show(
                      NutrientsDrawer,
                      { totals: DEMO_TOTALS },
                      { side: 'left', width: 'min(85vw, 360px)' },
                    )
                  }
                />
              </Specimen>

              <Specimen name="<FoodsNutrients>" note="полная таблица нутриентов + кнопка нормы" full>
                <FoodsNutrients totals={DEMO_TOTALS} />
              </Specimen>

              <Specimen name="<HomeTopBar>" note="верхняя обвязка: аккаунт + дата → ScheduleNavigatorDrawer" full>
                <div className={s.topBarStage}>
                  <HomeTopBar date={DEMO_DATE} />
                </div>
              </Specimen>

              <Specimen name="<AnalysisCtaButton>" note="CTA анализа → AnalysisKindDrawer">
                <AnalysisCtaButton date={DEMO_DATE} />
              </Specimen>

              <AnatomyBlock e={ANATOMY_BY_ID['an-row']} />
            </Section>

            {/* ── 09 Features ── */}
            <Section
              id="features"
              index="09"
              title="Фичи"
              desc="Карточки поиска, редактор количества, порции, длинное нажатие. Внизу — разбор «Карточка-поверхность»: три разных представления о том, что такое «карточка»."
            >
              <Specimen name="<FoodActionCard>" note="каталог · своя добавка · блюдо (richness-бар по белку)" full>
                <ul className={s.cardList}>
                  <FoodActionCard
                    variant="product"
                    item={DEMO_FOOD_CARDS.catalogProduct}
                    onClick={() => toast('выбран продукт')}
                    onInfoClick={() => {}}
                    richNutrientId="1"
                    richNutrientUnit="г"
                    richNutrientMax={5}
                    richNutrientNorm={75}
                  />
                  <FoodActionCard
                    variant="product"
                    item={DEMO_FOOD_CARDS.userProduct}
                    onClick={() => toast('выбрана добавка')}
                    onInfoClick={() => {}}
                  />
                  {/* No onInfoClick on the dish card: a dish info-button navigates
                      to /dish/<id> (a dead route here) and leaves the gallery. */}
                  <FoodActionCard
                    variant="dish"
                    item={DEMO_FOOD_CARDS.dish}
                    onClick={() => toast('выбрано блюдо')}
                  />
                </ul>
              </Specimen>

              <Specimen name="<ProductQuantity>" note="число + чипы порций + множитель" wide>
                <ProductQuantity
                  content={{
                    quantity: 150,
                    updateQuantity: (q: number) => toast(`количество: ${q} г`),
                    product: { portions: DEMO_PORTIONS },
                  }}
                  onFinish={() => {}}
                  inputId="uikit-pq-input"
                />
              </Specimen>

              <Specimen name="<FoodPortionsManager>" note="только чтение">
                <FoodPortionsManager portions={DEMO_PORTIONS} />
              </Specimen>

              <Specimen name="<FoodPortionsManager>" note="editable + implicit-строка «Всё блюдо»">
                <FoodPortionsManager
                  portions={DEMO_PORTIONS}
                  implicitPortion={DEMO_IMPLICIT_PORTION}
                  onUpdate={(label, u) => toast(`${label}: ${JSON.stringify(u)}`)}
                />
              </Specimen>

              <Specimen name="<LongPressRow>" note="базовая поверхность строки — клик + удержание" full>
                <div className={s.rowStack}>
                  {[0, 1, 2].map((i) => (
                    <LongPressRow
                      key={i}
                      id={`uikit-lpr-${i}`}
                      index={i}
                      onClick={() => toast('клик')}
                      onLongPress={() => toast('удержание')}
                    >
                      <span className={s.demoLprText}>Строка {i + 1} — нажми или удержи</span>
                    </LongPressRow>
                  ))}
                </div>
              </Specimen>

              <AnatomyBlock e={ANATOMY_BY_ID['an-card']} />
            </Section>

            {/* ── 10 Drawers & Modals (real stores) ── */}
            <Section
              id="drawers"
              index="10"
              title="Дроверы и модалки"
              desc="Открываются настоящими drawerStore.show / modalStore.show — ровно как в проде. ProductDrawer берёт реальный id каталога (read-only). Кнопки «Открыть» — dev-триггеры."
            >
              <Specimen name="ItemActionsDrawer" note="long-press меню: удалить + действия">
                <DemoButton
                  onClick={() =>
                    drawerStore.show(ItemActionsDrawer, {
                      title: 'Абрикос',
                      onDelete: () => toast('удалить (демо — no-op)'),
                      actions: [
                        { label: 'Дублировать', onClick: () => toast('дублировать') },
                        { label: 'Информация о продукте', onClick: () => toast('инфо') },
                      ],
                    })
                  }
                >
                  Открыть
                </DemoButton>
              </Specimen>

              <Specimen name="NutrientsDrawer" note="боковой разбор нутриентов">
                <DemoButton
                  onClick={() =>
                    drawerStore.show(
                      NutrientsDrawer,
                      { totals: DEMO_TOTALS },
                      { side: 'left', width: 'min(85vw, 360px)' },
                    )
                  }
                >
                  Открыть
                </DemoButton>
              </Specimen>

              <Specimen name="DailyNormDrawer" note="нижний лист дневной нормы (анкета/просмотр)">
                <DemoButton onClick={() => drawerStore.show(DailyNormDrawer, {})}>Открыть</DemoButton>
              </Specimen>

              <Specimen name="ProductDrawer" note="каталожный продукт (id 4185 «абрикос»)">
                <DemoButton
                  onClick={() =>
                    drawerStore.show(
                      ProductDrawer,
                      { productId: CATALOG.apricot.id, productName: CATALOG.apricot.name },
                      { side: 'left', width: 'min(85vw, 360px)' },
                    )
                  }
                >
                  Открыть
                </DemoButton>
              </Specimen>

              <Specimen name="NutrientPickerDrawer" note="выбор нутриента для richness-фильтра">
                <DemoButton
                  onClick={async () => {
                    const pick = await drawerStore.show(
                      NutrientPickerDrawer,
                      { activeId: '1' },
                      { side: 'left' },
                    );
                    if (pick) toast(`выбран нутриент: ${pick.id} (${pick.unit})`);
                  }}
                >
                  Открыть
                </DemoButton>
              </Specimen>

              <Specimen name="ScheduleNavigatorDrawer" note="выбор даты (резолв в toast, без навигации)">
                <DemoButton
                  onClick={async () => {
                    const d = await drawerStore.show(ScheduleNavigatorDrawer, {
                      selectedDate: DEMO_DATE,
                    });
                    if (d) toast(`выбрана дата: ${d}`);
                  }}
                >
                  Открыть
                </DemoButton>
              </Specimen>

              <Specimen name="AnalysisKindDrawer" note="выбор вида анализа (день / по неделям)">
                <DemoButton onClick={() => drawerStore.show(AnalysisKindDrawer, { date: DEMO_DATE })}>
                  Открыть
                </DemoButton>
              </Specimen>

              <Specimen name="ProfileDrawer" note="аккаунт + данные + опасная зона">
                <DemoButton onClick={() => drawerStore.show(ProfileDrawer, {}, { side: 'left' })}>
                  Открыть
                </DemoButton>
              </Specimen>
            </Section>
          </main>
        </div>
      </div>

      {/* ModalShell rendered the canonical way — fullscreen via ModalByLabel,
          always mounted, expands/collapses by state. */}
      <ModalByLabel
        position="fixed"
        isExpanded={shellOpen}
        content={
          <ModalShell variant="spring4">
            <ModalShell.Title>Каркас модалки</ModalShell.Title>
            <ModalShell.Hint>
              Полноэкранный ModalShell — так он и живёт в проде (через ModalByLabel). Spring-орбы —
              фон всего экрана, заголовок/кнопки в своих слотах.
            </ModalShell.Hint>
            <ModalShell.Body>
              <div className={s.overlayBody}>
                <Text variant="hint">
                  Контент шага кладётся в <code>ModalShell.Body</code>.
                </Text>
                <NumberInput value={shellQty} onChange={setShellQty} size="big" />
              </div>
            </ModalShell.Body>
            <ModalShell.ActionButtons
              left={
                <Button variant="ghost" onClick={() => setShellOpen(false)}>
                  Закрыть
                </Button>
              }
              right={<ModalNextButton variant="finish" onClick={() => setShellOpen(false)} />}
            />
          </ModalShell>
        }
      />
    </>
  );
};

export default UiKitPage;
