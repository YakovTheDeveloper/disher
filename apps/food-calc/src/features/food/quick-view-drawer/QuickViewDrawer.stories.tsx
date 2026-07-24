import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Drawer } from '@base-ui/react/drawer';
import { DrawerSideProvider, DrawerSnapProvider } from '@/shared/ui/DrawerLayout';
import type { ResolvedDrawerOptions } from '@/shared/ui/overlay-types';
import type { SelectOption } from '@/shared/ui/atoms/Select';
import { nutrientDisplayGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { db } from '@/shared/lib/dexie/schema';
import { putRow } from '@/shared/lib/dexie/write';
import { USER_NORM_ID } from '@/entities/daily-norm/model/default-norm';
import { QuickViewDrawer, QUICK_VIEW_SNAP_POINTS } from './QuickViewDrawer';

// ─── Демо-данные ───────────────────────────────────────────────────────────────
// nutrients/норма ключуются по РЕАЛЬНОМУ id нутриента, поэтому берём id из боевых
// констант `nutrientDisplayGroups` (тот же источник, что NutrientDenseView) — не
// хардкодим строковые id, чтобы стори не рассыпалась при их переименовании.
const mainGroup = nutrientDisplayGroups[0];
const nutrientId = (name: string): string =>
  mainGroup.content.find((n) => n.name === name)?.id ?? name;

// «Алыча», на 100 г — заполняет энергию + Б/Ж/У + клетчатку/сахар/воду, чтобы
// витрина показала полный стек, а не пустой скелет.
const DEMO_NUTRIENTS: Record<string, number> = {
  [nutrientId('energy')]: 46,
  [nutrientId('protein')]: 0.5,
  [nutrientId('fats')]: 0.3,
  [nutrientId('carbohydrates')]: 11,
  [nutrientId('fiber')]: 1.5,
  [nutrientId('sugar')]: 9.9,
  [nutrientId('water')]: 87,
};

// Демо-норма — чтобы `NormLegendButton` показал состояние «норма задана» и у рядов
// появилась колонка «% доли». Сеется в Dexie loader'ом ниже (Storybook в браузере
// ⇒ IndexedDB настоящий, fake-indexeddb не нужен).
const DEMO_NORM: Record<string, number> = {
  [nutrientId('energy')]: 2000,
  [nutrientId('protein')]: 75,
  [nutrientId('fats')]: 60,
  [nutrientId('carbohydrates')]: 250,
};

const DEMO_PORTIONS: SelectOption[] = [
  { value: '100', label: 'На 100 г' },
  { value: '150', label: 'Порция 150 г' },
  { value: '30', label: '1 шт · 30 г' },
];

// ─── Швартовка дровера ──────────────────────────────────────────────────────────
// QuickViewDrawer → DrawerLayout рендерит `Drawer.Popup` и читает snap/side-контекст,
// поэтому в изоляции нужен тот же каркас, что в DrawerManager: Root → Portal →
// Viewport → Side/Snap-провайдеры. Отличия от прода — намеренные, чтобы лист стоял
// СТАТИЧНОЙ панелью для чистого снимка story.to.design, а не парящим fixed-оверлеем:
//   · modal={false} + без Backdrop — нет скрима и scroll-lock'а;
//   · портал в локальный фрейм-див (position:relative) — лист живёт внутри канвы;
//   · scoped-CSS переводит `#drawer-content` (стабильный id от DrawerLayout) в
//     position:relative + transform:none + max-height:none ⇒ попап встаёт в
//     нормальный поток, фрейм обнимает его целиком, весь контент виден без скролла.
const DRAWER_OPTS: ResolvedDrawerOptions = {
  side: 'bottom',
  snapPoints: QUICK_VIEW_SNAP_POINTS,
  defaultSnapPoint: QUICK_VIEW_SNAP_POINTS[0],
};

type StoryArgs = {
  title: string;
  kind: 'product' | 'my-product' | 'dish';
  heroName?: string;
  hasNutrients: boolean;
  loading?: boolean;
  basisLabel?: string;
};

// Пришвартованная сцена: фрейм + каркас Base UI Drawer + сам QuickViewDrawer.
// Держит локальный selectedPortion (селект контролируемый) и достраивает пропы,
// которые в бою даёт адаптер (portionOptions/nutrients/pageRoute). basisLabel-стори
// (супплемент) отдаёт пустой portionOptions ⇒ показывается тихий бейдж базиса.
// ЖИВЁТ как element data-роутера (ниже): useViewTransitionNavigate → RR7
// `useViewTransitionState` требует ИМЕННО data router (createMemoryRouter), а не
// компонентный <MemoryRouter> — иначе invariant-краш.
function DrawerStage(args: StoryArgs) {
  const [portion, setPortion] = useState('100');
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const isSupplement = !!args.basisLabel;
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        background: 'var(--sys-color-surface-2, #ece7de)',
      }}
    >
      <div
        ref={setFrame}
        className="sb-drawer-frame"
        style={{
          position: 'relative',
          width: 390,
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.16)',
        }}
      >
        {frame && (
          <Drawer.Root
            open
            modal={false}
            snapPoints={QUICK_VIEW_SNAP_POINTS}
            snapPoint={QUICK_VIEW_SNAP_POINTS[0]}
          >
            <Drawer.Portal container={frame}>
              <Drawer.Viewport className="sb-viewport">
                <DrawerSideProvider value={DRAWER_OPTS}>
                  <DrawerSnapProvider
                    value={{ atTopSnap: true, canExpand: true, toggleSnap: () => {} }}
                  >
                    <QuickViewDrawer
                      title={args.title}
                      kind={args.kind}
                      heroName={args.heroName}
                      pageRoute="#"
                      basisLabel={args.basisLabel}
                      portionOptions={isSupplement ? [] : DEMO_PORTIONS}
                      selectedPortion={portion}
                      onSelectPortion={setPortion}
                      nutrients={args.hasNutrients ? DEMO_NUTRIENTS : {}}
                      hasNutrients={args.hasNutrients}
                      loading={args.loading}
                      onClose={() => {}}
                    />
                  </DrawerSnapProvider>
                </DrawerSideProvider>
              </Drawer.Viewport>
            </Drawer.Portal>
          </Drawer.Root>
        )}
      </div>
      <style>{`
        .sb-viewport { position: static !important; }
        .sb-drawer-frame #drawer-content {
          position: relative !important;
          transform: none !important;
          max-height: none !important;
        }
      `}</style>
    </div>
  );
}

function QuickViewDrawerDemo(args: StoryArgs) {
  // Data router (не компонентный <MemoryRouter>): RR7 useViewTransitionState жив
  // только под data router'ом. portion-стейт живёт ВНУТРИ DrawerStage (routed
  // element), поэтому выбор порции не пересобирает роутер — только args-смена.
  const router = useMemo(
    () =>
      createMemoryRouter([{ path: '*', element: <DrawerStage {...args} /> }], {
        initialEntries: ['/'],
      }),
    [args],
  );
  return <RouterProvider router={router} />;
}

const meta: Meta<StoryArgs> = {
  title: 'Food/QuickViewDrawer',
  render: (args) => <QuickViewDrawerDemo {...args} />,
  // Сеем демо-норму в Dexie ДО рендера (loader await'ится) — иначе на первом тике
  // useLiveQuery чип нормы отрисуется как «не задана». putRow (контракт записи), а
  // не сырой db.put — тот забанен линтом вне write.ts.
  loaders: [
    async () => {
      await putRow(db.daily_norms, {
        id: USER_NORM_ID,
        name: 'Демо-норма',
        description: '',
        items: DEMO_NORM,
        created_at: new Date().toISOString(),
      });
      return {};
    },
  ],
  args: {
    title: 'алыча',
    kind: 'product',
    heroName: 'Алыча',
    hasNutrients: true,
    loading: false,
  },
  argTypes: {
    kind: { control: 'inline-radio', options: ['product', 'my-product', 'dish'] },
    basisLabel: { control: 'text' },
    title: { control: 'text' },
    hasNutrients: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<StoryArgs>;

/** Продукт — арка вида «продукт» над кнопкой перехода, селект порции слева. */
export const Product: Story = {};

/** Блюдо — дуга-долина «блюдо» (kind='dish'). */
export const Dish: Story = {
  args: { title: 'борщ', kind: 'dish', heroName: 'Борщ' },
};

/** Супплемент — нет граммовых опор: вместо селекта тихий бейдж базиса «за порцию». */
export const Supplement: Story = {
  args: { title: 'омега-3', kind: 'product', heroName: 'Омега-3', basisLabel: 'за порцию' },
};

/** Пусто — нутриентов нет: подсказка «Добавить нутриенты можно на странице». */
export const Empty: Story = {
  args: { hasNutrients: false, loading: false },
};

/** Загрузка — ghost-скелетон, зеркалящий стек витрины (тик Dexie до подгрузки). */
export const Loading: Story = {
  args: { hasNutrients: false, loading: true },
};
