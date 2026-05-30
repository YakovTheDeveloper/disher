# USDA micronutrient backfill — 43 `usda-foundation` foods (2026-05-29)

## ✅ DONE 2026-05-30 — ЗАПИСАНО В SOURCE + КАТАЛОГ
**Last commit:** 0b397b79 "new"
**Working tree:** dirty. МОИ изменения (НЕ закоммичено, ждут запроса юзера на commit):
`seed/combined-foods-final.json` (+243 ячейки, strict-superset verified) и
`apps/food-calc/src/shared/data/catalog.json` (регенерирован, 406 foods).
**Backup:** `seed/combined-foods-final.backup.json` = pre-write оригинал (для отката).
**Branch:** feat/home-analyses-ui

### Итог записи (2026-05-30)
Резолвинг 4 TODO + запись:
- **кокосовая мука (7863): no-op.** Foundation 2515382 "Flour, coconut" подтверждён (минералы 1.00×
  байт-в-байт), НО содержит только минералы (уже заполнены) → 0 новых витаминных ячеек; SR-кокосовой-муки
  нет. Заполнять нечем → остаётся skip (причина в compose REJECTED исправлена на корректную).
- **гречневая мука (3175): SKIP (решение юзера).** Единственный кандидат whole-groat 170687 в ~2.3×
  богаче минералами нашей светлой муки → B-витамины завысил бы ~2×. Пустая ячейка честнее.
- **батат (7853): no-op.** Матч 2346404 верен, но 0 новых ячеек (всё нужное уже было).
- **курица (7881): switch → 171052 "meat only, raw" (решение юзера).** K-отпечаток решающий: наш K=252
  ≈ meat-only 229 vs ground 522. verify-chicken выбрал ground по P, но P не различает (178 vs 173).
  +9 ячеек (было +8 у ground): Mn19 Se15.7 холин65.7 B5 1.06 B6 0.43 B9 7 B12 0.37 D0.1 K1 1.8.
- **Запись:** `backfill --write` → added=243 foods=37 conflicts=0 changedExisting=0. Независимая
  семантическая проверка (backup vs source): strict superset, +243, 0 changed, 0 removed. ✓
- **build:catalog:** 406 foods (гейт держится, без потерь). Спот-чек: chicken meat-only долетел,
  перец C=138.57 сохранён, sweet potato βC=2220 сохранён, 3175/7863 витамины undefined (skip соблюдён).
- **Фронт-гейты:** `tsc --noEmit` чисто (exit 0). `vitest run` = 466 pass / 3 fail — все 3 fail в
  `TimePicker.test.tsx` (кнопка «Системный»), **pre-existing** (воспроизводятся на закоммиченном каталоге),
  с моим data-change НЕ связаны (нет coupling к catalog/nutrients).

### ⚠️ Побочные баги в каталоге (НЕ мои, флаг юзеру — отдельная задача):
- курица (7881) **Zn=42 мг/100г** — невозможно (норма ~1 мг). Битое старое значение, не микро. НЕ тронуто.
- бразильский орех Se=280 мкг (реально ~1920, занижено ~7×). Старое значение, non-overwrite оставил.

### Осталось (опц., по запросу юзера):
- commit (мои 2 файла + при желании застейжить чужие uncommitted UI-правки — feedback_include_user_design_changes).
- (опц.) починить 2 побочных бага выше отдельным проходом.

---

## ⏸️ CHECKPOINT 2026-05-29 вечер (исторический — выполнено 2026-05-30)
**Last commit:** 25d2614c "много"
**Working tree:** dirty (чужие M-файлы + мои новые scripts/tds/seed-артефакты — НЕ коммичено)
**НЕ в коммите / source НЕ тронут:** `seed/combined-foods-final.json` всё ещё оригинал (есть backup
`seed/combined-foods-final.backup.json`, identical). Payload готов: `seed/micro-backfill-payload.json`
= 242 ячейки / 37 продуктов. `backfill --write` ещё НЕ выполнен.
**Branch:** feat/home-analyses-ui

### Где остановились
Показал юзеру полную таблицу 43 матчей. Прогнал ДВА независимых агента-аудитора (свежий контекст):
1. **Аудит значений/единиц/non-lossy** → чисто: 0 перезаписей, 0 ошибок единиц (Cu/Mn ×1000 верны),
   0 несовпадений значений, 0 фабрикаций. Вердикт: payload безопасен.
2. **Аудит названий рус→англ (43 строки)** → НИ ОДНОГО неправильного продукта. Но нашёл правки:

### 🔧 ЗАВТРА — сделать ДО записи:
- **мука кокосовая (7863): SKIP БЫЛ НЕВЕРЕН** — seed-минералы БАЙТ-В-БАЙТ = Foundation **2515382
  "Flour, coconut"** (1.00×). Добавить этот матч в ACCEPTED (micro-compose.ts), дозаполнить.
- **мука гречневая (3175): SKIP спорен** — есть SR **170687 "Buckwheat flour, whole-groat"** (верный
  вид/форма), НО наша мука = светлая/просеянная (Mg 107 vs 251, K 254 vs 577, ~2× беднее). Whole-groat
  завысит. Решить с юзером: матчить 170687 (с оговоркой про завышение) или оставить skip.
- **(опционально) сладкий картофель (7853):** матч 2346404 верен по виду, но seed-минералы ~2× выше —
  возможно есть SR-запись raw sweet potato ближе к нашему отпечатку. Перепроверить.
- **(опционально) курица (7881):** ground chicken (171116) спорно для общей «курицы»; 171052
  "Chicken, broilers, meat only, raw" — лучше как generic (K 229 vs аномальные 522 у ground). Решить.

### Потом (после правок выше + approve):
`backfill --write` → `npm run build:catalog` (N=406 не упасть) → фронт `npm run test` + `tsc --noEmit`
→ спот-чек catalog.json. Команды и гейты — ниже в этом файле.

### Известные ПОБОЧНЫЕ баги (НЕ наши, НЕ трогаем, флаг юзеру):
- курица Zn=42 мг/100г (норма ~1) — битое старое значение.
- бразильский орех Se=280 мкг (реально ~1920, в ~7× занижено) — старое значение, non-overwrite оставил.

---

**Last commit:** 25d2614c "много"
**Working tree:** dirty (много чужих M-файлов фронта/бэка, не мои)
**НЕ в коммите:** мои скрипты `scripts/micro-tool.ts`, `sr-tool.ts`, `micro-compose.ts`,
`verify-workflow.js`, `verify-chicken.js`, `micro-*.ts` (review/recon/showcase/safetycheck);
`seed/micro-backfill-payload.json`, `seed/micro-foundation-payload.json`,
`seed/combined-foods-final.backup.json`; этот план; `content/FoodData_Central_sr_legacy_*.json` (210MB).
Источник `seed/combined-foods-final.json` ПОКА не тронут (только dry-run + backup).
**Branch:** feat/home-analyses-ui

## Цель
Заполнить пустые МИКРО-ячейки (id 9–35) у 43 продуктов `source='usda-foundation'` реальными
измеренными значениями USDA FoodData Central, в наших единицах. Только пустые; энергию/макросы не
трогать; реальный ноль не «чинить».

## Источники
- Foundation: `content/FoodData_Central_foundation_food_json_2026-04-30.json` (363 valid). Витаминные
  панели РЕДКИЕ (E 16%, A 13%, B2 34%) → закрывал лишь 10/543. → решение юзера: добавить SR Legacy.
- SR Legacy: `content/FoodData_Central_sr_legacy_food_json_2021-10-28.json` (7793, полные расчётные панели).
  URL: `fdc-datasets/FoodData_Central_sr_legacy_food_json_2021-10-28.zip`. НЕ в git (210MB).

## Верифицировано в коде
- build:catalog = `tsx scripts/build-catalog.ts`; seed → `apps/food-calc/src/shared/data/catalog.json`.
- Единицы — `src/constants/nutrients.ts`. Cu(16)/Mn(17) у нас мкг, FDC даёт mg → ×1000.
- Матч по `nutrient.id` (НЕ number). Единицы сверены (numref): 0 mismatch.
- «Пусто» = ключ ОТСУТСТВУЕТ. Явный 0 = реальный ноль, не трогаем (audit: 536 absent + 7 zeros).

## Метод (анти-фабрикация в центре)
1. Минеральный fingerprint: corr = median|ln(fdc/our)| по Fe/Mg/P/Ca/K/Zn (минералы пережили
   сломанный импорт) → опознаём правильную запись/сорт.
2. **Независимая верификация (workflow, 86 агентов, web-сверка)** — НЕ доверяю своему матчингу.
   Каждый продукт: агент сам выбирает правильный raw/plain продукт из кандидатов SR+FDN ИЛИ reject-all,
   флагует неправдоподобные значения; затем состязательный refute. В payload — только прошедшее.
   Воркфлоу ИСПРАВИЛ мои матчи: миндальное/соевое молоко → plain Foundation (не chocolate/coffee),
   сладкий картофель → корнеплод (не leaves), мука миндальная → blanched almonds, перец → red.
3. Курица переверифицирована отдельно (verify-chicken) → 171116 "Chicken, ground, raw".

## РЕЗУЛЬТАТ
- **42/43 матчей приняты** (1 не считая курицы изначально, потом курица добавлена).
- **Drop suspect-значений** (флаг верификатора, оставляем пусто): кале B4, плантаны K1, свекольная зелень B4.
- **SKIP (2, не фабрикуем):**
  - мука гречневая (3175): единственный кандидат whole-groat flour, Mg/K ~2.3× выше нашей рафинированной.
  - мука кокосовая (7863): все кандидаты = coconut MEAT (стружка), K ~4× ниже муки. Нет SR-аналога.
- **К записи: 242 ячейки, 37 продуктов** (6 без новых: молоко мин./соев., сладкий картофель, перец,
  гречка-цельная нет — у них всё нужное уже было или skip).
- Приоритетные закрыты: E~20, B2~15, A~10, C~11, B1~10, B3~10, βC~11, Na~8.

## ⚠️ Найден ПОБОЧНЫЙ баг (НЕ мой, НЕ трогаю)
Существующее `курица` (7881) Zn=42 мг/100г — невозможно (норма ~1 мг). Битое значение в каталоге,
не микро и не наша задача. Флаг юзеру.

## ГАРАНТИИ записи
1. backup: `seed/combined-foods-final.backup.json` (identical=true до записи).
2. backfill добавляет ТОЛЬКО отсутствующие ключи; самопроверка changedExisting==0 иначе abort+не пишет.
3. safetycheck: foods=37 cells=242 OVERLAPS=0 zeroValues=0 negValues=0.
4. dry-run: `added=242 foods=37 conflicts=0 parseOK changedExisting=0`.
5. `git diff` покажет только добавленные строки.

## Осталось (ждёт approve)
1. `backfill --write` → combined-foods-final.json
2. `build:catalog` → catalog.json (N=406 не должно упасть)
3. post-audit + спот-чек (перец C=138.57 сохранён; sweet potato βC=2220 сохранён)
4. фронт `npm run test` + `tsc --noEmit`

## Iteration log
- 2026-05-29 (1): Foundation(363); baseline 543; покрывает только 10/543 → стоп, спросил юзера.
- 2026-05-29 (2): пивот SR Legacy(7793). match+corr поймал плохие матчи → независимая верификация.
- 2026-05-29 (3): workflow wu7ob3y9d (40/43 ok, исправил мои матчи, 3 skip, 3 drop) + verify-chicken
  (курица→171116). compose → 242 ячейки/37 продуктов. Все гейты зелёные. Backup есть.
  **СТОП на show-before-write. Жду approve юзера → backfill --write + build:catalog + tests.**
- 2026-05-30 (4): резолв 4 TODO. verify-flours.ts: кокосовая = no-op (2515382 минералы-only, 0 новых,
  SR-муки нет); гречневая 170687 = wrong grade (~2× завышение). Юзер: гречку SKIP, курицу → 171052
  meat-only (K-отпечаток 252≈229 vs ground 522). compose → 243 ячейки/37. safetycheck/dry-run зелёные.
  **backfill --write** (added=243, changedExisting=0) + независимая superset-проверка ✓. build:catalog=406.
  tsc чисто; vitest 466/469 (3 fail = pre-existing TimePicker, не связаны). ✅ DONE. Не закоммичено (ждёт юзера).