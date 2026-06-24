import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';

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
import { Heading, Text, QuietLabel } from '@/shared/ui/atoms/Typography';
import Button from '@/shared/ui/atoms/Button/Button';
import BackButton from '@/shared/ui/atoms/Button/BackButton/BackButton';
import CloseButton from '@/shared/ui/atoms/Button/CloseButton/CloseButton';
import { QuietActionButton } from '@/shared/ui/atoms/Button/QuietActionButton';
import SuggestActionButton from '@/shared/ui/SuggestActionButton/SuggestActionButton';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar/AppBottomBarShell';
import NumberInput from '@/shared/ui/atoms/input/NumberInput/NumberInput';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch/AutoGrowSearch';
import { Select } from '@/shared/ui/atoms/Select/Select';
import { Chip } from '@/shared/ui/atoms/Chip/Chip';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import LabeledCheckbox from '@/shared/ui/LabeledCheckbox/LabeledCheckbox';
import Breadcrumbs from '@/shared/ui/Breadcrumbs/Breadcrumbs';
import FoodName from '@/shared/ui/atoms/Typography/FoodName/FoodName';
import Quantity from '@/shared/ui/Quantity/Quantity';
import { ChangeHighlight } from '@/shared/ui/ChangeHighlight';
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
import { LongPressRow } from '@/features/shared/long-press-item';
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer';
import { AnalysisCtaButton } from '@/features/analysis/AnalysisCtaButton';
import { AnalysisKindDrawer } from '@/features/analysis/AnalysisKindDrawer';
import { DailyNormDrawer } from '@/features/dailyNorms/DailyNormDrawer';
import { DailyNormButton } from '@/features/dailyNorms/DailyNormButton/DailyNormButton';
import { ProductDrawer } from '@/features/food/product-drawer';
import { NutrientPickerDrawer } from '@/features/food/food-search/NutrientPickerDrawer';
import { ScheduleNavigatorDrawer } from '@/features/schedule-navigator';
import { ProfileDrawer } from '@/features/auth/ProfileDrawer';

// Real component style modules — imported ONLY so the debt catalog can render
// each local one-off button LIVE (its actual class, not a re-creation). pages may
// import widgets/features (downward FSD). Trade-off: if one of these classes is
// renamed, its preview here silently loses styling — acceptable for a dev page.
// (Laboratory / DailyAnalysisSection / WriteFoodInput local classes больше не
// импортируются — discoveriesBtn / bannerButton / readyCta объединены в Button
// variants link/secondary, превью рендерит сам примитив.)
import authFormStyles from '@/features/auth/AuthForm.module.scss';
import balanceStyles from '@/features/auth/BalanceSection.module.scss';
import inlineReviewStyles from '@/features/food/food-free-text-parse/ui/InlineWriteFoodReview.module.scss';
// Reused only for the placeholder-accent preview (§03 an-field) so it matches the
// real serif-italic first-word treatment instead of re-creating the class.
import writeBarStyles from '@/shared/ui/WriteBarShell/WriteBarShell.module.scss';
import ListIcon from '@/shared/assets/icons/list.svg?react';

// Static no-op for the controlled-input previews in the anatomy tables — they
// demonstrate the surface live, not editing (value stays put).
const NOOP = () => {};

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
type AnatomyPart = {
  part: string;
  role: string;
  css: string;
  why: string;
  smell?: boolean;
  /** Optional live render of the primitive (shown in the «Примитив» cell). */
  preview?: React.ReactNode;
};
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
    win: true,
    intro:
      'RESOLVED 2026-06-19: было два конкурирующих языка «выбери один из N» (Tabs — CAPS-заливка; квадратная SwitcherTab-плитка — white-paper lift). Оба сняты. Остался ОДИН канон: NavSwitcher tab-as-title — на HomePage, Product, Dish и Discoveries.',
    parts: [
      {
        part: 'NavSwitcher tab-as-title — активный',
        role: 'выбранный раздел поглощает роль заголовка',
        css: 'Onest bold-sans 38px (голос Heading), opacity 1',
        why: 'активный = буквально заголовок экрана; тот же display-голос, что у <Heading>',
      },
      {
        part: 'NavSwitcher tab-as-title — неактивный',
        role: 'тихий указатель «вы здесь»',
        css: 'serif italic 14px, opacity 0.22 (QuietLabel)',
        why: 'курсив = интерактивность; полупрозрачность = не перетягивать внимание',
      },
      {
        part: 'точки-индикатор (.swipeDots)',
        role: '«какой раздел из N» + аффорданс «свайпай»',
        css: '5px точки, активная — pill 16px',
        why: 'крупный заголовок сам не кричит «листай» — точки добавляют сигнал',
      },
    ],
    critique:
      'Канон сведён к одному облику (data-dv NavSwitcher=tab-as-title, хардкод на предке — облик зафиксирован, не делит персист-ключ DesignBar между страницами). Tabs (CAPS-заливка) удалён целиком — был ровно один dev-потребитель (BugReportModal рисует свои табы локально). Квадратная плитка ретайрнута.',
    improve:
      'Остался мёртвый square-base в SwitcherTab.module.scss (`.tile` aspect-ratio:1 + `.tileActive` paper-lift + ось SwitcherTabAmbient, невидимая под прозрачным tab-as-title) — снести отдельным проходом ПОСЛЕ визуальной проверки 3 страниц.',
  },
  {
    id: 'an-button',
    title: 'Кнопка действия',
    intro:
      'После ревизии 2026-06-19 у Button 5 живых вариантов: primary, secondary, link, '
      + 'ghost, brand. bottomActionBar свёрнут в brand (это было место — «в баре», а не вид). '
      + 'brand сам themeable: дефолт sage-жёлтый, DishPage перекрашивает его в sky через '
      + '--cta-brand-* (туда слит бывший runButton разбора блюда — без второго варианта). '
      + 'Мёртвые имена-по-виду (tertiary, danger, filter, filter-2, menu, primary-form) удалены ранее.',
    parts: [
      {
        part: 'primary',
        role: 'главное действие формы / подтверждения',
        css: 'width:100%, ink-заливка, белый текст, высота 56px',
        why: 'заливка-акцент = «это основной путь»',
        preview: <Button variant="primary">Сохранить</Button>,
      },
      {
        part: 'brand',
        role: 'фирменная CTA (единый цвет primary-действий, themeable)',
        css: 'pill, заливка --cta-brand-fill (дефолт sage-жёлтый), ink-текст, высота 56px (как primary)',
        why: 'один вариант, цвет через --cta-brand-* — DishPage перекрашивает в sky, не плодя второй вариант',
        preview: (
          <Button variant="brand" icon={<PlusGlyph />}>
            Разобрать
          </Button>
        ),
      },
      {
        part: 'secondary',
        role: 'вторичное действие рядом с primary',
        css: 'белая пилюля, ink-окаёмка 16%, мягкая тень, min-height 40px, ink press-fill',
        why: 'тише primary по заливке (белый, не ink) — «второй путь», не навигация; база — bannerButton «Повторить»',
        preview: <Button variant="secondary">Повторить</Button>,
      },
      {
        part: 'link',
        role: 'тихая подчёркнутая ссылка-кнопка (ведёт куда-то)',
        css: 'прозрачная, подчёркнута, опц. ведущая иконка',
        why: 'семантика «навигация / скролл», не действие; вынесена из локальных discoveriesBtn / readyCta / switchBtn',
        preview: (
          <Button variant="link" icon={<ListIcon width={18} height={18} />}>
            Мои открытия
          </Button>
        ),
      },
      {
        part: 'ghost',
        role: 'тихая текст-ссылка / отмена',
        css: 'курсив, weight 200, подчёркнут, серый',
        why: 'минимальный вес = «это ссылка, не кнопка-действие»',
        preview: <Button variant="ghost">Отмена</Button>,
      },
    ],
    critique:
      'Имя-по-виду / по-месту — двигатель разрастания. Ревизия 2026-06-19 дочистила: bottomActionBar (peach-rose стекло) свёрнут в brand — нижний бар не отдельный вид кнопки, а место; высота brand выровнена с primary (56px, было 72). press-отклик убран из таблицы — это свойство ВСЕХ вариантов, а не отдельный примитив. Локальный sky-CTA разбора блюда (runButton/rerunButton) тоже слит в brand — но как ТЕМА (--cta-brand-* override на DishPage), а не второй вариант brand-2: цвет — это ось темы, не новый вариант.',
    improve:
      'Если линейка снова разрастётся — свести к осям: intent (primary / quiet / danger) × size × context, цвет — через --cta-* токены, не через новые варианты. Тихие текст-действия — в QuietActionButton, навигация-ссылки — в variant="link". Эталон темизации — brand (sage по умолчанию, sky на DishPage одним набором --cta-brand-*).',
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
        css: 'тёплый 3-stop градиент, radius 24px, через --sys-field-bg-*',
        why: 'не плоско (stripe-fork прав. 1); токены объявлены выше → предок переопределяет тон',
        preview: (
          <AutoGrowSearch singleLine value="" onChange={NOOP} placeholder="тёплая пилюля" />
        ),
      },
      {
        part: 'fading hairline (::after)',
        role: 'разделитель снизу',
        css: 'тающая линия 1px, прозрачная по краям',
        why: 'тающая линия, а не рамка (stripe-fork прав. 2) — мягче «коробки»',
        preview: (
          <AutoGrowSearch value="" onChange={NOOP} placeholder="тающая линия снизу" />
        ),
      },
      {
        part: 'placeholder-accent',
        role: 'первое слово плейсхолдера',
        css: 'serif italic, weight 500',
        why: 'serif-акцент намекает на «тему» поля',
        preview: (
          <AutoGrowSearch
            singleLine
            value=""
            onChange={NOOP}
            placeholder="Заметка про вкус"
            renderPlaceholder={
              <>
                <em className={writeBarStyles.placeholderAccent}>Заметка</em> про вкус
              </>
            }
          />
        ),
      },
      {
        part: 'NumberInput',
        role: 'числовое поле (количество / норма)',
        css: 'центр, focus-ring #0070f3 + ring, radius 6px (raw); size=big — крупнее',
        why: 'отдельный примитив с numeric-клавиатурой и draft-стейтом (пустая строка ≠ 0)',
        smell: true,
        preview: <NumberInput value={120} maxLength={4} />,
      },
    ],
    critique:
      'AutoGrowSearch / Select / LabeledCheckbox делят ОДНУ систему --sys-field-* (один тон) — это win. NumberInput по-прежнему выпадает: сырой #0070f3 focus-ring + raw 6px radius, не --sys-field-* токены (дефолтная рамка прозрачная, #ccc в коде НЕТ). Числовое поле звучит из другой системы (но мёртвые «underline/grey/white»-скины уже сняты — расхождение сузилось до одного focus-ring).',
    improve: 'Перевести NumberInput на --sys-field-* токены (фон + focus-ring), чтобы все поля говорили одним голосом.',
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
      '3 места рисуют свой .sectionLabel вместо FieldLabel (ProductQuantity, ProfileDrawer, BalanceSection) — расходятся вес, цвет, курсив. Локальный .fieldLabel остался только в dev-баре (DesignVariantsBar), не в фичах.',
    improve: 'Заменить на FieldLabel; новые .*Label-классы ловить на ревью / линтом.',
  },
  {
    id: 'an-heading',
    title: 'Заголовок',
    parts: [
      {
        part: 'Heading (единый display-канон)',
        role: 'заголовок экрана / оверлея / слайда (role="display" masthead) / активного таба',
        css: 'Onest bold-sans (Apple Large Title register), размеры по роли',
        why: 'ОДИН display-голос — Masthead свёрнут сюда (2026-06-19)',
      },
      {
        part: 'QuietLabel',
        role: 'тихий указатель: неактивный таб / шаг-крошка',
        css: 'serif italic 14px, opacity 0.22',
        why: 'намеренный второй ярус — «музейная табличка», не заголовок',
      },
    ],
    critique:
      'RESOLVED (2026-06-19): задвоение display-голоса убрано. Heading = единственный Onest bold-sans голос, role-only (size удалён 2026-06-23; Masthead → masthead-проп, Typography/ScreenLabel удалены). serif-italic живёт только в QuietLabel (тихий указатель); заголовки секций нутриентов переехали на Heading role="title" sans.',
    improve:
      'Канон зафиксирован: display = Heading (bold-sans, role display/headline/title), тихий ярус = QuietLabel (serif-italic). Голоса инкапсулированы в примитивах, typography-миксины удалены. Text стал role-only — ось variant удалена 2026-06-24 (hint→role="caption", navTabQuiet→QuietLabel, sectionLabel→Heading title). Heading size-проп удалён 2026-06-23; FieldLabel слетел на role="label" sans.',
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
        part: 'SwitcherTab — приподнятая плитка (РЕТАЙРНУТО)',
        role: 'был «card-выбор» (inverse-lift)',
        css: 'lift снят: под tab-as-title плитка прозрачная, без тени',
        why: 'квадрат-карточка ретайрнут 2026-06-19 — больше не философия карточки',
        smell: true,
      },
      {
        part: 'Analysis .card',
        role: 'feature-карточка',
        css: 'плоский paper-mono content (--space + --sys-elevation-flat)',
        why: 'вторая философия карточки',
        smell: true,
      },
    ],
    critique:
      'После ретайра приподнятой SwitcherTab-плитки осталось два представления о «карточке»: плоская-бумага (SheetCard) и feature-локальная (Analysis .card).',
    improve:
      'Канон секций — «карточка-лист» (SheetCard). Analysis-карточки свести к SheetCard или осознанно выделить как вторую роль.',
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
        <Heading role="headline" as="h2" className={s.sectionTitle}>
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
        <Heading role="headline" as="h3" className={s.anatomyTitle}>
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
                <td className={s.anatomyPart}>
                  {p.part}
                  {p.preview && <div className={s.cellPreview}>{p.preview}</div>}
                </td>
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

// ─── §02 Buttons — flat showcase data ─────────────────────────────────────────
// Each component = a name header + a stack of items. One item = a live preview
// with a caption «variant — essence» right under it (Apple gallery stacking:
// sight ↔ meaning together, no columns). Multi-button previews just wrap.
type KitRow = {
  /** Bold mono lead of the caption (variant / mode name); omitted = plain caption. */
  variant?: string;
  preview: React.ReactNode;
  /** One-sentence essence. Omit + set `unknown` when the суть isn't established. */
  essence?: string;
  /** Semantic band: relation tag — «← Button primary» / «автономная». */
  builtOn?: string;
  /** Chrome primitive (BackButton / CloseButton) — tiny tinted chip behind it. */
  darkStage?: boolean;
  /** Суть не выяснена → render a red «не выяснено» instead of the essence. */
  unknown?: boolean;
};
type KitComp = { name: string; note?: string; rows: KitRow[] };

const PRIMITIVE_COMPS: KitComp[] = [
  {
    name: 'Button',
    note: 'главный примитив',
    rows: [
      {
        variant: 'primary',
        preview: <Button variant="primary">Подтвердить</Button>,
        essence: 'Главное действие формы — заливка-акцент во всю ширину.',
      },
      {
        variant: 'secondary',
        preview: <Button variant="secondary">Повторить</Button>,
        essence: 'Вторичное действие рядом с primary — тише по заливке.',
      },
      {
        variant: 'brand',
        preview: (
          <Button variant="brand" icon={<PlusGlyph />}>
            Разобрать
          </Button>
        ),
        essence: 'Фирменная CTA — тон через --cta-brand-* (sage, sky на DishPage).',
      },
      {
        variant: 'link',
        preview: (
          <Button variant="link" icon={<ListIcon width={16} height={16} />}>
            Мои открытия
          </Button>
        ),
        essence: 'Ссылка-кнопка: ведёт куда-то (навигация / скролл), не действие.',
      },
      {
        variant: 'ghost',
        preview: <Button variant="ghost">Отмена</Button>,
        essence: 'Тихая отмена / текст-ссылка — минимальный вес.',
      },
      {
        variant: 'состояния',
        essence: 'isLoading блокирует + спиннер · disabled · ведущий значок before / icon.',
        preview: (
          <>
            <Button variant="primary" isLoading>
              loading
            </Button>
            <Button variant="primary" disabled>
              disabled
            </Button>
            <Button variant="brand" before={<PlusGlyph />}>
              before
            </Button>
          </>
        ),
      },
    ],
  },
  {
    name: 'BackButton',
    rows: [
      {
        darkStage: true,
        preview: <BackButton onClick={() => toast('назад')} />,
        essence: 'Единый жест «назад» на весь app — одна ‹-стрелка вместо разнобоя.',
      },
    ],
  },
  {
    name: 'CloseButton',
    rows: [
      {
        darkStage: true,
        preview: <CloseButton onClick={() => toast('закрыть')} />,
        essence: 'Единый крестик закрытия оверлея.',
      },
    ],
  },
  {
    name: 'QuietActionButton',
    rows: [
      {
        preview: (
          <QuietActionButton
            label="Тихое действие"
            icon={<PlusGlyph />}
            onClick={() => toast('quiet action')}
          />
        ),
        essence: 'Тихая текст-кнопка-кирпич: значок + label без подложки; смысл задаёт консумер.',
      },
    ],
  },
  {
    name: 'ModalNextButton',
    rows: [
      {
        variant: 'next · finish',
        essence: 'Primary-confirm в футере модалок: «Далее» (стрелка) или «Готово» (галка).',
        preview: (
          <>
            <ModalNextButton onClick={() => toast('далее')} variant="next" />
            <ModalNextButton onClick={() => toast('готово')} variant="finish" />
          </>
        ),
      },
    ],
  },
  {
    name: 'AppBottomBarShell',
    note: 'side=split',
    rows: [
      {
        essence: 'Каркас нижнего дока без своей поверхности — раскладывает CTA (left / right / split).',
        preview: (
          <AppBottomBarShell side="split">
            <Button variant="brand" icon={<PlusGlyph />}>
              Добавить
            </Button>
            <Button variant="brand">Разобрать</Button>
          </AppBottomBarShell>
        ),
      },
    ],
  },
];

const SEMANTIC_COMPS: KitComp[] = [
  {
    name: 'SuggestActionButton',
    rows: [
      {
        builtOn: '← QuietActionButton',
        preview: (
          <SuggestActionButton label="Предложить нутриенты" onClick={() => toast('предложить')} />
        ),
        essence: 'AI-предложка: sparkle + label поверх QuietActionButton — единый вид предложений.',
      },
    ],
  },
  {
    name: 'DailyNormButton',
    rows: [
      {
        builtOn: '← QuietActionButton',
        preview: <DailyNormButton />,
        essence: 'Кнопка дневной нормы (текст по состоянию) — по клику открывает DailyNormDrawer.',
      },
    ],
  },
  {
    name: 'AnalysisCtaButton',
    rows: [
      {
        builtOn: '← Button brand',
        preview: <AnalysisCtaButton date={DEMO_DATE} label="Анализировать" />,
        essence: 'Доменная CTA запуска разбора: открывает AnalysisKindDrawer, спиннер на стрим.',
      },
    ],
  },

  // Бывший «технический долг» — локальные кнопки фич, перенесены сюда. Тег связи:
  // «← примитив» = переиспользует общий вариант; «автономная» = свой класс, не
  // сведён в примитив (намеренно). Где суть не выяснена — флаг `unknown` (красным).
  {
    name: 'submitBtn',
    note: 'AuthForm · CheckInbox · VerifyEmail',
    rows: [
      {
        builtOn: '← Button primary',
        preview: <Button variant="primary">Войти</Button>,
        essence: 'Отправка формы авторизации.',
      },
    ],
  },
  {
    name: 'bannerButton',
    note: 'DailyAnalysisSection',
    rows: [
      {
        builtOn: '← Button secondary',
        preview: <Button variant="secondary">Повторить</Button>,
        essence: 'Повтор после ошибки разбора дня.',
      },
    ],
  },
  {
    name: 'runButton / rerunButton',
    note: 'DishAnalysisScreen',
    rows: [
      {
        builtOn: '← Button brand',
        preview: <Button variant="brand">Проанализировать</Button>,
        essence: 'Запустить / перезапустить разбор блюда (sky-тон через --cta-brand-*).',
      },
    ],
  },
  {
    name: 'readyCta',
    note: 'WriteFoodInput',
    rows: [
      {
        builtOn: '← Button link',
        preview: <Button variant="link">Посмотреть варианты</Button>,
        essence: '«Смотреть результат» → скролл к предложке (навигация).',
      },
    ],
  },
  {
    name: 'closeButton',
    note: 'CreateLongAnalysisModal · AnalysisDetailModal',
    rows: [
      {
        builtOn: '← CloseButton',
        darkStage: true,
        preview: <CloseButton onClick={() => toast('закрыть')} />,
        essence: 'Закрыть × модалку разбора.',
      },
    ],
  },
  {
    name: 'backBtn',
    note: 'AuthForm · ModalHeader · Edit/CreateDailyNormModal',
    rows: [
      {
        builtOn: 'автономная',
        darkStage: true,
        preview: (
          <button type="button" className={authFormStyles.backBtn} aria-label="Назад">
            ←
          </button>
        ),
        essence:
          'Локальный «назад» — 3 намеренных вида (bar ‹ / modal arrow / auth ←), сознательно не сведены в BackButton.',
      },
    ],
  },
  {
    name: 'commitBtn / cancelBtn',
    note: 'InlineWriteFoodReview',
    rows: [
      {
        builtOn: 'автономная',
        preview: (
          <>
            <button type="button" className={inlineReviewStyles.cancelBtn}>
              Отменить
            </button>
            <button type="button" className={inlineReviewStyles.commitBtn}>
              Добавить 3
            </button>
          </>
        ),
        essence:
          'Подтвердить / отменить разбор — намеренная pill-пара предложки (ink pill + tinted), не 56px modal-CTA.',
      },
    ],
  },
  {
    name: 'topupBtn',
    note: 'BalanceSection',
    rows: [
      {
        builtOn: 'автономная',
        preview: (
          <button type="button" className={balanceStyles.topupBtn} disabled>
            Пополнить — скоро
          </button>
        ),
        essence: 'Пополнить баланс — намеренный тихий disabled-плейсхолдер «скоро», не CTA.',
      },
    ],
  },
];

/** One item — Apple gallery stacking: the live preview, then a caption
 *  «variant — essence» directly under it. No columns, no horizontal spread. */
function KitItem({ r }: { r: KitRow }) {
  return (
    <div className={s.kitItem}>
      <div className={clsx(s.kitItemStage, r.darkStage && s.kitItemStageDark)}>{r.preview}</div>
      <p className={s.kitItemCaption}>
        {r.variant && (
          <>
            <span className={s.kitItemVariant}>{r.variant}</span>
            <span className={s.kitItemDash}> — </span>
          </>
        )}
        {r.unknown ? <span className={s.kitItemUnknown}>не выяснено</span> : r.essence}
        {r.builtOn && <span className={s.kitBuiltOn}> {r.builtOn}</span>}
      </p>
    </div>
  );
}

/** One component block: name (+ note) header and its stack of items. */
function KitComp({ c }: { c: KitComp }) {
  return (
    <div className={s.kitComp}>
      <div className={s.kitCompHead}>
        <span className={s.kitCompName}>{c.name}</span>
        {c.note && <span className={s.kitCompNote}>{c.note}</span>}
      </div>
      <div>
        {c.rows.map((r, i) => (
          <KitItem key={r.variant ?? i} r={r} />
        ))}
      </div>
    </div>
  );
}

/** A black-bold band («Примитивы» / «Семантическое применение») — title only, no
 *  descriptive lead; holds a stack of KitComp. Spans the full section row. */
function ButtonBand({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={s.kitBand}>
      <h3 className={s.kitBandTitle}>{title}</h3>
      {children}
    </section>
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
        <Heading role="headline">Drawer</Heading>
        <Text role="caption">
          DrawerLayout — каркас нижней или боковой панели: drag-handle, крестик, скролл-зона и
          закреплённый <code>footer</code>. Открывается через <code>drawerStore.show()</code>.
        </Text>
        <Text role="caption">
          Боковой вариант открывается с опцией <code>{`{ side: 'right', width }`}</code>.
        </Text>
      </div>
    </DrawerLayout>
  );
}

// ─── Static config ───────────────────────────────────────────────────────────
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

// ─── Page ────────────────────────────────────────────────────────────────────
const UiKitPage = () => {
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
            <Heading role="headline" as="h1" className={s.railBrand}>
              UI Kit
            </Heading>
            <Text role="caption">Живая витрина общих компонентов Disher</Text>
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
              desc="Источник правды для заголовков и текста. Heading — единый Onest bold-sans display-голос, Text — тело (role body/label/caption), QuietLabel — тихий serif-указатель. Внизу — разбор ролей «Заголовок» и «Метка поля»."
            >
              <Specimen name="<Heading>" note="role: display · headline · title" wide>
                <div className={s.stack}>
                  <Heading role="display">Display 38px</Heading>
                  <Heading role="headline">Headline 28px</Heading>
                  <Heading role="title">Title 17px</Heading>
                </div>
              </Specimen>

              <Specimen
                name="<Text role='caption'>"
                role={<>Роль: спокойная подсказка. Где: под полем, под заголовком оверлея. Зачем: тише тела — это пояснение, не контент.</>}
              >
                <Text role="caption">Спокойная подсказка под полем или заголовком оверлея.</Text>
              </Specimen>

              <Specimen
                name="<QuietLabel>"
                role={<>Роль: тихий serif-italic указатель. Где: неактивный таб, шаг-крошка. Зачем: «вы здесь», не контрол.</>}
              >
                <QuietLabel>QuietLabel — тихий указатель</QuietLabel>
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
              desc="Базовая кнопка и её применение. В каждой строке — вариант, живой вид и суть одним предложением."
            >
              <ButtonBand title="Примитивы">
                {PRIMITIVE_COMPS.map((c) => (
                  <KitComp key={c.name} c={c} />
                ))}
              </ButtonBand>

              <ButtonBand title="Семантическое применение">
                {SEMANTIC_COMPS.map((c) => (
                  <KitComp key={c.name} c={c} />
                ))}
              </ButtonBand>
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
                role={<><b>Что:</b> textarea, растущая по мере ввода (тёплая pill, --sys-field-* токены). <b>Роль:</b> свободный текст / заметка. <b>Где:</b> write-бары, поля заметок. <b>Зачем:</b> единый текст-примитив; <code>maxRows</code> ограничивает рост.</>}
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
                note="Base UI · --sys-field-* тон"
                role={<><b>Что:</b> тонкая обёртка над Base UI Select (та же библиотека, что Drawer/Dialog). <b>Роль:</b> выбор одного из списка. <b>Где:</b> поля выбора в модалках. <b>Зачем:</b> тема через --sys-field-* токены доезжает и в портал попапа.</>}
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
              desc="Чипы, чекбоксы, крошки и каноничный переключатель разделов (NavSwitcher tab-as-title). Внизу — разбор «Сегмент-выбор»: канон сведён к одному облику (Tabs удалён, квадратная плитка ретайрнута)."
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

              <Specimen name="<Breadcrumbs>" note="шаги визарда с результатами" wide>
                <Breadcrumbs
                  steps={BC_STEPS}
                  current={bcStep}
                  stepLabels={BC_LABELS}
                  stepResults={BC_RESULTS}
                  onStepClick={setBcStep}
                />
              </Specimen>

              <Specimen
                name="<ScreenIndicator>"
                note="каноничный NavSwitcher (вшитый numerals-left) — активный = заголовок"
                role={<><b>Что:</b> ряд табов экранов (примитив SwitcherTab). Активный = крупный заголовок (Heading), неактивные — тихие serif-указатели, под ними номера таблиц I·II·III «свайпай раздел». <b>Где:</b> HomePage, ProductPage, DishBuilderPage, DiscoveriesScreen. <b>Зачем:</b> единый облик переключения разделов на весь app. <b>Облик:</b> вшит дефолтом (баком 2026-06-22, DesignBar-ось снята); выравнивание — <code>{'data-nav-align="left|center"'}</code> на предке. Квадратная плитка (white-paper lift) ретайрнута 2026-06-19.</>}
                full
              >
                {/* Anchor-узел несёт `data-nav-align` (left дефолт) — ровно как на
                    боевых страницах (SwipeDeck/ScheduleNavigator ставят его из пропа align). */}
                <div data-nav-align="left">
                  <ScreenIndicator
                    screens={SCREEN_TILES}
                    activeIndex={screenIdx}
                    onSelect={setScreenIdx}
                    bandImg={false}
                  />
                </div>
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
                      <Text role="caption">Контент живёт во floating-портале и закрывается по клику вне.</Text>
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
                note="строка еды · продукт · вода · блюдо · своя добавка (палитра lemon — в проде на FoodSchedule)"
                full
              >
                {/* Food palette is baked `lemon` on FoodSchedule's own
                    `.foodListAnchor` (module-scoped); the row boundary look is
                    baked borderless + gutter-time now (RowBoundary anchor
                    retired) — this kitchen-sink specimen shows the base rows. */}
                <div>
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
              </Specimen>

              <Specimen name="<ScheduleEventCard>" note="строка события (lemon вшит) — scale/tag/relation чипы" full>
                {/* Events have no palette anchor (lemon baked-in 2026-06-13); the
                    boundary look is baked borderless + gutter-time (anchor retired). */}
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
                <Text role="caption">
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
