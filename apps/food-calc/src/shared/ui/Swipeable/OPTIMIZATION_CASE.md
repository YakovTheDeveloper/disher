# Кейс: оптимизация карусели до 60fps

## Контекст задачи

Мобильное SPA (React + TypeScript). Главная страница — три полноэкранных слайда-карусель:
1. **FoodsNutrients** — десятки карточек нутриентов с прогресс-барами
2. **FoodSchedule** — список еды, сгруппированный по времени, со сложными модалками
3. **ScheduleEvents** — список событий

Библиотека — Embla Carousel (JS-based, анимация через `transform: translate3d()`).

**Проблема:** визуально заметные просадки fps при свайпе между слайдами.

---

## Как рендерит браузер — pipeline

Чтобы понять оптимизации, нужно понимать rendering pipeline:

```
JS → Style → Layout → Paint → Composite
```

1. **JS** — выполняется код (React рендер, Embla rAF loop)
2. **Style** — браузер вычисляет computed styles для каждого элемента
3. **Layout** (Reflow) — вычисление геометрии: позиции, размеры всех элементов
4. **Paint** — растеризация: пиксели каждого элемента записываются в bitmap-текстуры
5. **Composite** — GPU собирает текстуры (layers) в финальный кадр

**Ключевой факт:** Composite — единственный этап, который гарантированно быстрый и работает на отдельном потоке (compositor thread). Если анимация задевает только Composite — это 60fps. Если затрагивает Layout или Paint — будут просадки.

`transform` и `opacity` — единственные свойства, которые обрабатываются ТОЛЬКО на этапе Composite (при условии, что элемент на своём GPU-слое).

---

## Оптимизация 1: `transform: translateZ(0)` на каждом слайде

### Что делает
Промоутит элемент в отдельный **compositor layer** (GPU-слой).

### Как это работает внутри
Без промоушена все слайды — часть одного слоя. Когда Embla двигает контейнер через `transform: translate3d(Xpx, 0, 0)`, браузер должен:
- Перерисовать (Paint) весь контейнер целиком — все 3 слайда — потому что они на одном слое
- Это ~300vw контента на каждый кадр

С промоушеном каждый слайд — отдельная GPU-текстура. Браузер рисует их один раз, а потом просто двигает готовые текстуры на GPU. Paint = 0 за кадр.

### Почему `translateZ(0)` а не `will-change: transform`

Оба промоутят слой, но:
- `will-change: transform` — **подсказка** браузеру, что элемент будет анимироваться. Браузер **может** (но не обязан) промоутить. Плюс: резервирует ресурсы заранее.
- `transform: translateZ(0)` — **факт**: элемент уже имеет 3D-трансформацию → браузер **обязан** создать отдельный слой.

Использовать оба одновременно — двойное резервирование ресурсов без пользы. Мы выбрали `translateZ(0)` как гарантию.

### Цена
Каждый GPU-слой потребляет видеопамять (≈ width × height × 4 bytes). Три полноэкранных слайда на iPhone 14 (390×844 @3x = 1170×2532) ≈ 1170 × 2532 × 4 × 3 ≈ **35 MB**. Это ОК, но не стоит промоутить сотни элементов.

---

## Оптимизация 2: `contain: strict`

### Что делает
Говорит браузеру: "содержимое этого элемента **не может повлиять** на что-либо за его пределами". `strict` = `size + layout + style + paint`.

### Подробно по каждому containment:

**`contain: size`** — размер элемента не зависит от его содержимого. Браузер не пересчитывает размер слайда при изменении DOM внутри. Это важно: без `size` containment, если внутри слайда добавляется элемент списка, браузер должен проверить — не изменился ли размер слайда → не изменилась ли геометрия соседних слайдов → не изменилась ли геометрия контейнера. Это каскадный Layout.

**`contain: layout`** — layout элемента изолирован. Internal layout changes не вызывают reflow у родителя и сиблингов. Без этого: ScheduleEvents добавляет элемент → Layout пересчитывает все 3 слайда + контейнер.

**`contain: style`** — CSS-счётчики и `quotes` ограничены этим поддеревом. Менее критично для нашего случая, но входит в `strict`.

**`contain: paint`** — содержимое не рисуется за пределами элемента (как `overflow: hidden` для paint). Плюс: создаёт stacking context и containing block для `position: fixed` потомков. Браузер может полностью пропустить Paint для этого элемента, если он за пределами viewport.

### Почему `strict` а не `layout style paint`
`strict` = `size + layout + style + paint`. Добавление `size` означает, что у слайда фиксированный размер (100% × 100%) и браузер **никогда** не будет пересчитывать его геометрию из-за изменений контента. Для full-width/full-height слайдов это безопасно и даёт максимальную изоляцию.

---

## Оптимизация 3: `content-visibility: auto`

### Что делает
Браузер **полностью пропускает рендеринг** (Style + Layout + Paint) для элементов, которые находятся за пределами viewport.

### Как это работает
Браузер использует IntersectionObserver внутри. Если слайд не пересекается с viewport:
- Его содержимое не проходит Style → Layout → Paint
- Элемент занимает место (`contain-intrinsic-size`), но внутри — пусто для рендерера
- Когда слайд приближается к viewport — браузер рендерит его заранее

### `contain-intrinsic-size: 100vw 100dvh`
Без этого свойства элемент с `content-visibility: auto` схлопнется в 0×0 когда он off-screen (потому что его содержимое пропущено → нечему задавать размер). `contain-intrinsic-size` — это "placeholder" размер.

`100dvh` а не `100vh` — `dvh` учитывает динамическую адресную строку мобильных браузеров.

### Реальный эффект
Из 3 слайдов в каждый момент рендерятся только 1-2. Это сокращает работу Style + Layout + Paint на ~50-66%.

---

## Оптимизация 4: `backface-visibility: hidden` на контейнере

### Что делает
Скрывает заднюю сторону элемента при 3D-трансформациях. Побочный эффект: промоутит элемент в отдельный compositor layer.

### Зачем на контейнере
Контейнер (`.emblaContainer`) — это элемент, который Embla двигает через `transform`. Промоутив его, мы гарантируем, что перемещение = чистый Composite, без Paint.

---

## Оптимизация 5: `useState` → `useRef` для индекса слайда

### Проблема
Оригинальный код:
```tsx
const [selectedSlide, setSelectedSlide] = useState(defaultSlide);

// Embla 'select' event fires mid-drag when crossing a snap point
emblaApi.on('select', () => {
  setSelectedSlide(emblaApi.selectedScrollSnap()); // ← React re-render!
});
```

При свайпе, в момент пересечения snap-точки, Embla стреляет `select`. `setState` → React ставит в очередь re-render → reconciliation → VDOM diff → DOM update. Это происходит **mid-drag**, пока палец ещё на экране и Embla анимирует transform каждый rAF.

React re-render компонента Swipeable означает re-render всех 3 children (FoodsNutrients, FoodSchedule, ScheduleEvents). Каждый из них — тяжёлый виджет с десятками DOM-элементов. Это забивает main thread на 10-50ms → пропущенные кадры.

### Решение
```tsx
const indexRef = useRef(defaultSlide);

emblaApi.on('settle', () => {  // 'settle', не 'select'
  const newIndex = emblaApi.selectedScrollSnap();
  indexRef.current = newIndex;
  onIndexChange?.(newIndex, children.length);
});
```

`useRef` не вызывает re-render. Компонент не перерисовывается mid-drag вообще.

---

## Оптимизация 6: `settle` вместо `select` для callback

### Разница событий Embla:
- **`select`** — срабатывает когда Embla **решил** что целевой слайд изменился. Это mid-drag, палец ещё на экране.
- **`settle`** — срабатывает когда анимация **полностью завершена**. Палец поднят, слайд на месте.

### Почему это важно
`onIndexChange` в HomePage меняет `document.body.style.backgroundColor`. Это дёшево само по себе, но если callback вызывает setState в родителе — это re-render всего дерева. С `settle` любые побочные эффекты происходят **после** анимации, когда main thread свободен.

---

## Оптимизация 7: DOM-манипуляция для dots вместо React state

### Проблема
Dots должны реагировать на `select` (чтобы точка менялась пока палец ещё двигается). Но `select` + `setState` = re-render.

### Решение
```tsx
const dotsRef = useRef<HTMLDivElement>(null);

const updateDots = useCallback((index: number) => {
  const dots = dotsRef.current.children;
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.toggle(styles.dotActive, i === index);
  }
}, []);

emblaApi.on('select', () => {
  updateDots(emblaApi.selectedScrollSnap());  // прямой DOM, 0 React
});
```

`classList.toggle` — это микрооперация (~0.01ms). React re-render для изменения одного класса — это ~1-5ms минимум (VDOM diff, reconciliation, commit).

### Когда это оправдано
Только для hot path (анимации, drag). В обычном UI — всегда используй React state. Прямой DOM ломает React'овую модель данных и может привести к рассинхронизации.

---

## Оптимизация 8: Lock через ref вместо state + useEffect

### Было:
```tsx
const [lockCount, setLockCount] = useState(0);
const isLocked = lockCount > 0;

// useEffect отслеживает isLocked → вызывает reInit
useEffect(() => {
  emblaApi.reInit({ watchDrag: !isLocked });
}, [emblaApi, isLocked]);
```

Цепочка: `setLockCount` → re-render → useEffect → `reInit`. Два цикла рендера.

### Стало:
```tsx
const lockCountRef = useRef(0);

const lock = useCallback(() => {
  lockCountRef.current++;
  emblaApiRef.current?.reInit({ watchDrag: false });
}, []);
```

Прямой вызов: `lock()` → `reInit()`. Ноль ререндеров, синхронное выполнение.

---

## Оптимизация 9: Параметры Embla

### `duration: 0`
Длительность snap-анимации после отпускания пальца. `0` = мгновенный snap. Меньше кадров анимации = меньше работы для main thread.

Компромисс: нет плавной инерции после отпускания. Слайд просто встаёт на место.

### `watchResize: false`
Embla по умолчанию слушает `ResizeObserver` на viewport. При каждом resize — `reInit()`, который делает:
- `getBoundingClientRect()` на каждом слайде (Layout read)
- Пересчёт snap-точек
- Переинициализация engine

На мобильном resize случается при:
- Появлении/скрытии адресной строки
- Повороте экрана
- Открытии клавиатуры

Каждый из этих моментов — уже стрессовый для main thread. Добавлять ещё и `reInit` Embla — лишняя нагрузка.

### `containScroll: false`
По умолчанию Embla вычисляет "trimmed" snap-точки чтобы не было пустого пространства после последнего слайда. Для full-width слайдов (`flex: 0 0 100%`) это бессмысленно — каждый слайд ровно один viewport, пустого пространства быть не может. Отключение убирает лишние вычисления при инициализации.

---

## Что НЕ помогло: CSS scroll-snap вместо Embla

Попробовали заменить Embla на нативный `scroll-snap-type: x mandatory`. Результат:
- **fps: идеальные 60fps** — scroll обрабатывается compositor thread
- **UX: неприемлемый** — нет нормального direction lock. Горизонтальный snap перехватывает жесты, предназначенные для вертикального скролла списка внутри слайда

JS-based direction lock (touchstart → touchmove → определяем dx/dy → toggle overflow) создаёт видимый "дёрг" — скролл начинается и обрывается через несколько мс, потому что JS меняет `overflow-x` и `scroll-snap-type` mid-gesture, что вызывает recalculate в браузере.

Embla решает direction lock на уровне JS ещё до начала скролла — палец двигается, но scroll container не трогается, пока Embla не решит что жест горизонтальный.

---

## Итого: карта оптимизаций по уровням

```
Уровень 1 — Compositor (GPU)
├── transform: translateZ(0) на слайдах → отдельные GPU-слои
├── backface-visibility: hidden на контейнере → промоушен контейнера
└── contain: strict → изоляция layout/paint

Уровень 2 — Rendering skip
├── content-visibility: auto → off-screen слайды не рендерятся
└── contain-intrinsic-size → placeholder размер

Уровень 3 — React (main thread JS)
├── useRef вместо useState → 0 ререндеров mid-drag
├── settle вместо select → callback после анимации
├── DOM classList для dots → обход React reconciliation
└── ref для lock → синхронный reInit без useEffect цепочки

Уровень 4 — Embla engine
├── duration: 0 → мгновенный snap
├── watchResize: false → нет resize observer
└── containScroll: false → нет лишних вычислений snap-точек
```

Уровни расположены по убыванию импакта. Compositor-оптимизации дают больше всего, потому что убирают целые этапы pipeline. React-оптимизации дают следующий по значимости эффект, потому что main thread — bottleneck на мобильных.
