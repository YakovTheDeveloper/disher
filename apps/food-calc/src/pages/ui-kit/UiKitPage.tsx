import { useState } from 'react';
import { toast } from 'sonner';

import { useSurface, type Surface } from '@/shared/lib/surface';
import {
  modalStore,
  drawerStore,
  ModalShell,
  ModalNextButton,
  type BaseDrawerProps,
} from '@/shared/ui';
import { Screen } from '@/shared/ui/Screen';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { Heading, Text, Typography } from '@/shared/ui/atoms/Typography';
import Button from '@/shared/ui/atoms/Button/Button';
import NumberInput from '@/shared/ui/atoms/input/NumberInput/NumberInput';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch/AutoGrowSearch';
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

import s from './UiKitPage.module.scss';

// ─── Small inline icon (Button `before` slot demo) ──────────────────────────
const PlusGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// ─── Showcase layout primitives ─────────────────────────────────────────────
function Section({
  index,
  title,
  desc,
  children,
}: {
  index: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={s.section}>
      <div className={s.sectionHead}>
        <span className={s.sectionIndex}>{index}</span>
        <div>
          <Heading size="section" as="h2" className={s.sectionTitle}>
            {title}
          </Heading>
          {desc && <p className={s.sectionDesc}>{desc}</p>}
        </div>
      </div>
      <div className={s.grid}>{children}</div>
    </section>
  );
}

/** A single labelled component sample. `name` is shown as a code caption. */
function Specimen({
  name,
  note,
  wide,
  children,
}: {
  name: string;
  note?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <figure className={wide ? `${s.specimen} ${s.specimenWide}` : s.specimen}>
      <div className={s.specimenStage}>{children}</div>
      <figcaption className={s.specimenLabel}>
        <span className={s.specimenName}>{name}</span>
        {note && <span className={s.specimenNote}>{note}</span>}
      </figcaption>
    </figure>
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

// ─── Page ────────────────────────────────────────────────────────────────────
const UiKitPage = () => {
  const [surface, setSurface] = useState<Surface>('lavender');
  useSurface(surface);

  // local interactive state
  const [num1, setNum1] = useState(50);
  const [num2, setNum2] = useState(250);
  const [num3, setNum3] = useState(7);
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
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
      <Screen className={s.shell}>
        <div className={s.inner}>
          <header className={s.topbar}>
            <div className={s.topbarTitleWrap}>
              <Heading size="screen" as="h1">
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
          </header>

          <main className={s.sections}>
            {/* ── 01 Typography ── */}
            <Section
              index="01"
              title="Типографика"
              desc="Источник правды для заголовков и текста. Heading — italic-serif канон, Text — тело."
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

              <Specimen name="<Text variant='hint'>">
                <Text variant="hint">Спокойная подсказка под полем или заголовком оверлея.</Text>
              </Specimen>

              <Specimen name="<Typography>" note="action · info · elegant · feature-title*" wide>
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
                  <Button variant="secondary" onClick={() => setChKey((k) => k + 1)}>
                    Изменить
                  </Button>
                </div>
              </Specimen>
            </Section>

            {/* ── 02 Buttons ── */}
            <Section index="02" title="Кнопки" desc="Button несёт 9 вариантов + состояния загрузки и disabled.">
              <Specimen name="<Button variant>" wide>
                <Button variant="primary">primary</Button>
                <Button variant="primary-form">primary-form</Button>
                <Button variant="secondary">secondary</Button>
                <Button variant="tertiary">tertiary</Button>
                <Button variant="danger">danger</Button>
                <Button variant="ghost">ghost</Button>
                <Button variant="filter">filter</Button>
                <Button variant="filter-2">filter-2</Button>
                <Button variant="menu">menu</Button>
              </Specimen>

              <Specimen name="<Button>" note="isLoading · disabled · before">
                <Button variant="primary" isLoading>
                  loading
                </Button>
                <Button variant="primary" disabled>
                  disabled
                </Button>
                <Button variant="secondary" before={<PlusGlyph />}>
                  before
                </Button>
              </Specimen>

              <Specimen name='<Button variant="bottomActionBar">' note="нижний бар: иконка + метка (peach-rose · обводка · тень)" wide>
                <Button variant="bottomActionBar" icon={<PlusGlyph />}>
                  Добавить
                </Button>
                <Button variant="bottomActionBar">Без иконки</Button>
              </Specimen>
            </Section>

            {/* ── 03 Inputs ── */}
            <Section index="03" title="Поля ввода" desc="Числовое поле и авто-растущий текст. Реагируют на surface-палитру.">
              <Specimen name="<NumberInput>" note="size · color · variant · bottom" wide>
                <NumberInput value={num1} onChange={setNum1} size="small" color="grey" />
                <NumberInput value={num2} onChange={setNum2} size="big" color="white" boxShadow />
                <NumberInput value={num3} onChange={setNum3} variant="underline" bottom="шт." />
              </Specimen>

              <Specimen name="<AutoGrowSearch>" note="многострочное поле-заметка" wide>
                <AutoGrowSearch
                  value={note}
                  onChange={setNote}
                  placeholder="Заметка, растёт по мере ввода…"
                  maxRows={5}
                />
              </Specimen>

              <Specimen name="<AutoGrowSearch singleLine>" note="имя/тег + адорнменты" wide>
                <AutoGrowSearch
                  value={name}
                  onChange={setName}
                  singleLine
                  placeholder="Название продукта"
                  startAdornment={<PlusGlyph />}
                />
              </Specimen>
            </Section>

            {/* ── 04 Selection & navigation ── */}
            <Section index="04" title="Выбор и навигация" desc="Чипы, чекбоксы, табы, крошки и плитки навигации.">
              <Specimen name="<Chip active>" note="презентационный — toggle на стороне вызова" wide>
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

              <Specimen name="<ScreenIndicator>" note="ряд NavTile + полоса заголовка" wide>
                <ScreenIndicator
                  screens={SCREEN_TILES}
                  activeIndex={screenIdx}
                  onSelect={setScreenIdx}
                  bandImg={false}
                  title="Понедельник"
                />
              </Specimen>
            </Section>

            {/* ── 05 Lists & indicators ── */}
            <Section index="05" title="Списки и индикаторы" desc="Обёртка списка с пустым состоянием и индикатор скролла.">
              <Specimen name="<ItemsList>" note="ul-обёртка списка" wide>
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
            <Section index="06" title="Обратная связь" desc="Загрузка и тосты (sonner, смонтирован глобально).">
              <Specimen name="<Spinner>" note="size · color">
                <Spinner />
                <Spinner size={28} color="#7c6fae" />
              </Specimen>

              <Specimen name="toast()" note="sonner · 5 типов" wide>
                <Button variant="secondary" onClick={() => toast('Обычное уведомление')}>
                  default
                </Button>
                <Button variant="secondary" onClick={() => toast.success('Сохранено')}>
                  success
                </Button>
                <Button variant="secondary" onClick={() => toast.error('Что-то пошло не так')}>
                  error
                </Button>
                <Button variant="secondary" onClick={() => toast.info('Просто к сведению')}>
                  info
                </Button>
                <Button variant="secondary" onClick={() => toast.warning('Будьте внимательны')}>
                  warning
                </Button>
              </Specimen>
            </Section>

            {/* ── 07 Overlays ── */}
            <Section
              index="07"
              title="Оверлеи"
              desc="Модалки/дроверы/поповеры. Результат возвращается промисом / стейтом."
            >
              <Specimen name="ConfirmModal" note="modalStore.show → boolean" wide>
                <Button variant="secondary" onClick={() => openConfirm('default')}>
                  Подтверждение
                </Button>
                <Button variant="danger" onClick={() => openConfirm('danger')}>
                  Опасное действие
                </Button>
              </Specimen>

              <Specimen name="ModalShell" note="fullscreen каркас (ModalByLabel) — как в проде">
                <Button variant="primary" onClick={() => setShellOpen(true)}>
                  Открыть ModalShell
                </Button>
              </Specimen>

              <Specimen name="<PopoverTrigger>" note="floating-ui поповер">
                <PopoverTrigger
                  trigger={<Button variant="secondary">Открыть popover</Button>}
                  content={
                    <div className={s.popoverCard}>
                      <Text variant="hint">Контент живёт во floating-портале и закрывается по клику вне.</Text>
                    </div>
                  }
                />
              </Specimen>

              <Specimen name="DrawerLayout" note="bottom · side" wide>
                <Button variant="primary" onClick={() => drawerStore.show(DemoDrawer, {})}>
                  Нижний drawer
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    drawerStore.show(DemoDrawer, {}, { side: 'right', width: 'min(88vw, 380px)' })
                  }
                >
                  Боковой drawer
                </Button>
              </Specimen>
            </Section>
          </main>
        </div>
      </Screen>

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
                <NumberInput value={shellQty} onChange={setShellQty} size="big" color="white" bottom="граммы" />
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
