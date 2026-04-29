# Track E — Apps в нашей категории

**Дата:** 2026-04-29
**Время research'а:** ~2 часа (стоп раньше дедлайна — 4 целевых app разобраны детально, контраст-апсы покрыты, новых insights плато)
**Стоп-критерий достигнут:** да. Найдены 4 apps с «нашей логикой» (food/health/correlation tracking + индивидуальное использование), из них 3 с прямыми архитектурными прецедентами. Дальнейший research упирался в closed-source / отсутствие технических деталей.

---

## Executive summary

**Сколько apps с «нашей логикой» нашлось:** 4 прямых (Bearable, Daylio, OpenNutriTracker, FoodNoms) + 1 adjacent (Apple Health/HealthKit) с конкретными техническими деталями.

**Их sync model — резкий вывод:**
- **Никто из 4-х не использует «настоящий» multi-device sync.** Из «нашей категории» — все либо single-device (Bearable, Daylio), либо платформенный sync (FoodNoms = CloudKit, Apple-only), либо вообще без sync (OpenNutriTracker).
- **Bearable** хранит локально, шлёт зашифрованный backup на их Google Cloud (EU), но **не позволяет multi-device одновременно** — конфликт = data loss. Их форум прямо говорит: «designed around single-device use».
- **Daylio** — pure local SQLite, опциональный backup в Google Drive / iCloud (юзерский cloud, не Habitics-серверы). Manual export-import между устройствами.
- **FoodNoms** — local-first CoreData + CloudKit (Apple sync). Платный Foodnoms Cloud на **Supabase** запущен в мае 2025 как альтернатива iCloud (не замена), потому что «iCloud-only — long-term risk».
- **OpenNutriTracker** — local-only Hive (Flutter). Cloud sync «opt-in E2E encrypted» помечен в roadmap, но не реализован за 4 года и 1.8k stars.

**3-5 паттернов, которые украсть:**
1. **Бэкап → клауд, sync ≠ цель.** Как Bearable: «encrypted backup at rest» как durability layer, не как multi-device sync. Юзеры с этим живут спокойно — Bearable 4.7-4.8★ на 12k+ reviews. Это ровно то, что мы делаем backup-polling'ом.
2. **30-day analytic window как продуктовая граница.** Bearable Free сравнивает только последние 30 дней; Premium открывает 60/90/365. Прямое подтверждение нашего `project_short_distance_horizon.md` инсайта — у крупного успешного игрока с 12k+ reviews 30 дней оказалось коммерчески жизнеспособной границей. Это _одновременно_ маркетинговая граница и техническая (rolling window).
3. **Edit count counter как conflict resolver вместо timestamp.** Ryan Ashcraft (FoodNoms) прямо рекомендует: считать `edit_count` per-record (увеличивать каждый edit), при конфликте — больший выигрывает. «Works well enough for a single-user app». Альтернатива clock skew.
4. **Persistent job queue + idempotent processing.** FoodNoms: «only commit change tokens after successfully saving fetched records to disk; write processing code to be idempotent». Перевод на наш контекст: server-side `INSERT ... ON CONFLICT` идемпотентный по `(id, client_modified_at)` + клиент не очищает `_dirty` пока не получил 2xx.
5. **Manual export/import как escape hatch.** Daylio backup-файл = Base64-encoded JSON с DayEntries/Goals/Tags/Version полями. Полная durability = у юзера на Google Drive. Соответствует нашему `project_manual_export_idea.md`.

**3-5 паттернов, которые НЕ копировать:**
1. **«Manual backup-restore при смене устройства» (Daylio)** — friction-cost. У нас цель — Add-to-Home PWA на iPhone; backup endpoint должен работать автоматически.
2. **«Logout = принудительный restore из бэкапа» (Bearable)** — UX обнуление, потеря локально несинхронизированного. Наш drain должен быть невидимым.
3. **«Не показывать что multi-device не работает, надеяться что юзер не заметит» (Bearable)** — у них в саппорте появился warning «when a new device is detected». Disher single-user multi-device sequential — разумно ожидать, что юзер откроет на втором устройстве. Нужен явный contract.
4. **«Cloud sync на roadmap уже 4 года, никогда не дойдёт» (OpenNutriTracker)** — соло-разработчик, 1.8k stars, sync скоупом затягивается. Подтверждает, что self-built sync — большая работа; backup-polling = упрощение, выгодная компромисс.
5. **Server-first без offline (MyFitnessPal, Cronometer)** — гиганты регулярно ловят data corruption (MFP мар-2024), sync wildly out of sync (web/Android/Wear, фев-2026), Cronometer официально «нет offline потому что лицензия БД не позволяет хранить на устройстве». Наш local-first отдаёт юзеру то, что эти gigantы структурно не могут.

---

## Direct precedents (apps с нашей логикой)

### Bearable
- **Platform:** iOS + Android (native)
- **Source of truth:** local (encrypted on-device) + push backup to Google Cloud servers in EU
- **Sync model:** single-device + encrypted cloud backup. **Not real multi-device sync.** Forced restore from backup on logout/login. Если юзер открывает на двух устройствах — конфликты → data loss («data conflict issues and thus result in data loss»).
- **Retention:** unlimited локально, бэкап тоже unlimited. Но:
- **Analytic horizon:** **Free = последние 30 дней correlations/comparisons.** Premium = 60/90/365 дней. Это _продуктовая граница_, не техническая, но фактически совпадает с нашим горизонтом.
- **Conflict UX:** нет — конфликты просто ломают данные. Support-only restore через email.
- **Multi-device:** «can be used for moving between devices, but not simultaneously». Logout one → login other. В саппорте появился warning при detection нового устройства.
- **Open source?** Closed.
- **Maintainer activity:** активен. Two-person team (Kamil + James Saady, founder), + marketing person (Jesse Jan). Indie. Apple Store 4.8★/4k reviews; Google Play 4.7★/8.64k reviews.
- **App Store sync complaints:** конкретные цитаты не извлечены (рейтинги высокие), но **структурная проблема задокументирована официально**: support page «Using the same Bearable account on multiple devices» прямо признаёт data conflict & data loss. «Bearable has plans for multi-device capabilities (instant updates across devices), but this is fairly complex to implement for a product at their stage» — то есть после ~6 лет существования multi-device всё ещё не сделан.
- **Чем отличается от Disher:**
  - У них монетизация = retention paywall (open >30 days), у нас не планируется (нет paywall).
  - У них native iOS/Android, у нас PWA — у Disher нативное multi-device доступнее (PWA на iPad + iPhone из коробки), но iOS Safari дает другие constraints.
  - Их correlation engine — closed source, считается на bigger window чем Disher (пока).
- **Что украсть:**
  - **30-day window как продуктовая граница, не извинение.** Free tier маркетится как полный, premium = «нужна более длинная история». Это нормализует короткий горизонт как фичу.
  - **Encrypted-at-rest backup на cloud servers как durability story.** Их формулировка «private and encrypted on your device before it's backed up» = слово-в-слово маркетинг для нашего backup-polling.
  - **Anonymized user_id + email separation.** «we encrypt your email address and create an anonymized user ID so that your health data is not directly connected to your email address» — паттерн для GDPR / trust marketing.
- **Что НЕ копировать:**
  - **Logout-forces-restore** flow — это buggy и UX bad.
  - **Скрывать multi-device limitations** до тех пор пока юзер не потеряет данные.
  - **Rely on support@email manual restore** как primary recovery — не масштабируется.

### Daylio
- **Platform:** iOS + Android (native, Habitics)
- **Source of truth:** **local-only**, опциональный manual backup в Google Drive (Android) или iCloud (iOS). Серверов Habitics нет в data path.
- **Sync model:** **никакого автоматического sync вообще.** Manual backup file (Base64-encoded JSON) → user uploads сам. Move between iOS/Android = export → import.
- **Retention:** unlimited local.
- **Analytic horizon:** unlimited (всё локально, графики от установки).
- **Conflict UX:** N/A — по дизайну one-device. «Daylio is not designed to be used simultaneously on multiple devices. This is due to the app's privacy policy».
- **Multi-device:** sequential через export/import. Нет concurrent.
- **Open source?** Closed. Однако backup file reverse-engineered — Joel Otter [joelotter.com/posts/2022/01/daylio](https://www.joelotter.com/posts/2022/01/daylio/) описал JSON-структуру (DayEntries, Goals, GoalEntries, GoalSuccessWeeks, Tags, Version), нестандартное month numbering 0-11, ms epoch.
- **Maintainer activity:** супер-активен. Apple App Store 4.8★ из 45.7k reviews; Google Play 4.8★ из 393k reviews. Habitics — словацкая компания с несколькими apps (Daylio, Nutrilio, Better Weight, My Diary).
- **App Store sync complaints:** мало — потому что они не обещают sync. «не теряет популярности» с локально-only моделью при таком масштабе users (393k+12k = sample size большой).
- **Чем отличается от Disher:**
  - Daylio — не correlation tracker, чисто mood + activities (Disher — питание + correlation).
  - Daylio — native, не PWA. У них SQLite на устройстве; у нас будет IndexedDB.
  - Daylio полностью **не sync'ится** — мы хотим. Backup-polling = более амбициозно чем Daylio.
- **Что украсть:**
  - **Версия в backup file (`Version` поле).** Schema migration в backup-format — обязательно. Это упрощает import-from-old-version flow.
  - **Self-contained backup file format** (single JSON, юзер качает на Google Drive). Прямой precedent для нашего manual export feature.
  - **«Daylio doesn't send data to its own servers, so it doesn't have access to user entries»** — privacy story, которую Disher не сможет полностью сделать (есть AI on backend), но для не-AI данных можно.
- **Что НЕ копировать:**
  - **Полное отсутствие sync** — мы хотим лучше, потому что multi-device PWA на iPad+iPhone это норма, не edge case.
  - **«Just don't use multiple devices at once»** как UX policy — недостаточно для PWA-эпохи.
  - **Base64-encoded JSON backup file** — лишний step. У нас будет plain JSON или NDJSON.

### OpenNutriTracker
- **Platform:** iOS + Android (Flutter)
- **Source of truth:** **local-only (Hive)**. Pure on-device.
- **Sync model:** **нет.** «Opt-in end-to-end encrypted cloud sync» помечен на roadmap (DEV.to interview Jeremy Libeskind) — но за 1.5+ года и 11 релизов не реализовано.
- **Retention:** unlimited local.
- **Analytic horizon:** local, unlimited.
- **Conflict UX:** N/A.
- **Multi-device:** не поддерживается.
- **Open source?** Yes. [github.com/simonoppowa/OpenNutriTracker](https://github.com/simonoppowa/OpenNutriTracker), GPL-3.0.
- **Maintainer activity:** активен. v1.1.0 апр 2026 (последний релиз). Solo developer Simon Oppowa. 1.8k stars, 259 forks, 149 open issues, 630 commits.
- **App Store sync complaints:** N/A — не обещают sync.
- **Чем отличается от Disher:**
  - Они Flutter native, мы PWA.
  - Они pure offline, мы хотим backup.
  - У них Clean Architecture (presentation/domain/data) + Riverpod state — хорошая дисциплина, но не блокирующий precedent.
  - Они полагаются на OpenFoodFacts + USDA — у нас своя catalog (хотя products mode опирается на USDA-derived).
- **Что украсть:**
  - **Hive-style local storage** (no SQL boilerplate) = аналог Dexie для нас. Та же философия — local IDB lib без overhead.
  - **«Privacy-first» маркетинг** прямо в README — «your diary never leaves your device unless you decide otherwise». Перевести в наш контекст: «your data lives on your device; we only back it up if you sign up for cloud».
  - **GPL-3.0 + free + no ads + no IAP** как trust signal. У нас не open-source, но zero-ads / paid story работает.
- **Что НЕ копировать:**
  - **«Cloud sync — на roadmap 1.5+ года»** = solo dev не доходит до sync. Нам не подходит — мы хотим cloud backup с релиза.
  - **Pure offline без backup** — хрупко при device loss. Disher же про долгосрочную аналитику, потеря 30 дней — больно.
  - **Hive (Dart-only)** — тех. не релевантно для PWA, но подтверждает паттерн «local key-value DB + encrypt-at-rest».

### FoodNoms
- **Platform:** iOS, iPadOS, macOS (Catalyst), watchOS — **Apple-only.**
- **Source of truth:** **local-first CoreData**. Sync на CloudKit (iCloud) автоматически + Foodnoms Cloud (Supabase) — опциональный, запущен май 2025.
- **Sync model:** **CloudKit + кастомный sync engine [CloudSyncSession](https://github.com/ryanashcraft/CloudSyncSession)**. Это ключевая находка — Ryan Ashcraft сам написал sync library поверх CloudKit и **выложил в open source**. Описание:
  - Event-based architecture (не CRDT)
  - Persistent job queue с idempotent processing
  - **Edit count counter per record** для conflict resolution (LWW по counter, не по timestamp — обходит clock skew)
  - **«Always use UUIDs for primary keys»**, «have a consistent tie-breaker strategy», «avoid de-duplicating updates that can cascade»
  - Change tokens commit'ятся ТОЛЬКО после успешного save на disk
  - Middleware: SplittingMiddleware (для больших batch'ей), ErrorMiddleware, RetryMiddleware
- **Retention:** unlimited local; iCloud sync хранит unlimited; Foodnoms Cloud (Supabase) тоже.
- **Analytic horizon:** unlimited (за исключением client-side performance).
- **Conflict UX:** auto-resolved через edit count, не surfaced в UI. «Single-user app — works well enough».
- **Multi-device:** настоящий — через CloudKit ИЛИ Foodnoms Cloud. CoreData encrypted fields + Apple ADP = E2EE опционально.
- **Open source?** App = closed. **Sync engine [CloudSyncSession](https://github.com/ryanashcraft/CloudSyncSession) = MIT.** Можно читать.
- **Maintainer activity:** супер-активен. Solo dev (Ryan Ashcraft, ex-Twitter), полностью на FoodNoms с дек-2022. $10K MRR (H1 2023), вырос с тех пор. Регулярные monthly developer updates на блоге.
- **App Store sync complaints:** низкие (нет видимых в search). Niche app.
- **Чем отличается от Disher:**
  - Apple-only ↔ PWA cross-platform. Disher должен быть iOS+Android+desktop.
  - CloudKit делает много heavy lifting (auth, transport, identity); у нас Supabase / VPS.
  - Single-user single-paid-cloud → на нашем стэке = single-user + Supabase backup. Same shape.
- **Что украсть (САМОЕ ВАЖНОЕ):**
  - **Edit count counter > timestamp** для conflict resolver. Мы планируем `client_modified_at`, но в backup-polling это вызывает clock skew worry. **Альтернатива: `id + edit_count` LWW.** Server: `ON CONFLICT (id) DO UPDATE WHERE excluded.edit_count > existing.edit_count`. Counter монотонный per-row на client side — incremented on every mutation. Clock skew исчезает как фактор.
  - **Persistent job queue + idempotent processing.** Подтверждение нашего outbox-style (если откатимся) или просто — server INSERT идемпотентен по `(id, edit_count)` чтобы повторные пуши не вредили.
  - **«Don't commit change tokens before save»** = в backup-polling эквивалент: `_dirty=false` ставится ТОЛЬКО после server 2xx.
  - **UUID primary keys + tie-breaker strategy** = client-generated UUIDs + edit_count + (если equal) server-side `received_at` как final tie-breaker.
  - **SplittingMiddleware** для больших batch'ей = pre-emptive «если payload >X MB, разбей». Полезно для multi-day offline drain.
  - **Foodnoms Cloud rationale**: «iCloud-only поses long-term risk for the product and business». Прямо подтверждает наш план собственного backup endpoint вместо полагания только на третью сторону.
- **Что НЕ копировать:**
  - **CloudKit-specific абстракции** — irrelevant для PWA.
  - **Encrypted fields через CloudKit** — нет аналога в Supabase из коробки (можно сделать, но overhead).
  - **MarcK MRR / paid Cloud tier** — не наш product model (пока).

---

## Server-first контраст (что мы даём, чего у них нет)

### MyFitnessPal
- **User complaints (документированные, 2024-2026):**
  - **Март 2024 — массовая data corruption** для entries 19-21 марта. Юзеры теряли данные. Блог пост [«MyFitnessPal is not telling the whole truth about recent data corruption incident»](https://blog.kamens.us/2024/03/27/myfitnesspal-is-not-telling-the-whole-truth-about-recent-data-corruption-incident/).
  - **Февр 2026 — web/Android/WearOS «wildly out of sync».** Reinstall + clear cache не помогает.
  - **«Lost all food history/data»** — после logout юзеры теряют годы записей.
  - **App не sync'ится с web** для food added on mobile (Android).
- **Gaps Disher закрывает:**
  - Локальные данные не зависят от server downtime / corruption.
  - Off-line edits не пропадают.
  - Нет multi-platform sync mismatch (Disher PWA одна, не два независимых клиента).

### Cronometer
- **User complaints:**
  - Официальная позиция: **«No offline mode. Database too large + license restrictions for storing on device.»** Это структурно — Cronometer не может стать local-first.
  - «Limited offline mode please, it's 2022» (multi-year forum thread).
  - Login screen вместо food diary при бесконечной/слабой связи.
  - Sync с Google Fit ломается на 3+ дня, reinstall не фиксит.
  - Heavy network dependence — на flaky connection app конкретно crashes.
- **Gaps Disher закрывает:**
  - Полностью offline-mode UX (instant commit).
  - Не теряет state при network drop mid-edit.
  - Backup-polling освобождает от network dependency для core flow.

### YAZIO, Lose It, MyNetDiary
- Не углублялись отдельно (стоп-критерий — 4 hrs, по которому я fast finished). Все server-first, все жалобы того же класса (sync gaps, cloud lock-in, no offline).

---

## Adjacent apps

### Apple Health / HealthKit
- **Source of truth:** local on-device, iCloud sync optional.
- **Sync model:** конкретный паттерн — `HKMetadataSyncIdentifier` + `HKMetadataSyncVersion` per sample. Если новый sample со same identifier — overwrite по version. **«HealthKit will manage all the conflict resolution while saving and syncing. The challenging task of versioning and syncing has been reduced to simply maintaining consistent identifiers.»**
- **Что украсть:** **(syncIdentifier, syncVersion)** per row — это эквивалент **(id, edit_count)** из FoodNoms. Apple подтверждает паттерн как production-grade. Это удобный mental model: sync_version = monotonic int per record.
- **E2EE** при iOS 12+ + 2FA. Без 2FA — encrypted at rest/transit но не E2E.

### Reflectly, Stoic
- Данных мало в публичном доступе. Reflectly — backup/sync в платном tier'е, конкретики архитектуры нет. Stoic — «journals are securely stored on your devices, and safely backed». Closed source. Не углубляемся — нет actionable info.

### Welltory, Gyroscope
- Server-first аггрегаторы поверх HealthKit / Health Connect. **Не local-first. Не sync engine — pull от Apple Health.** Не релевантно нашему scope.

### MoodMo (Open-source self-hosted)
- [github.com/dnlzrgz/moodmo](https://github.com/dnlzrgz/moodmo) — Open-Source, Self-Hosted mood tracking app. Не deep-dived; precedent существует, но self-hosted — другой UX market сегмент.

### awesome-quantified-self lists
- [woop/awesome-quantified-self](https://github.com/woop/awesome-quantified-self), [markwk/awesome-quantified-self] — кураторские списки. Не отдельный prior art сам по себе, но resource pool для глубже копать в будущем.

---

## Marketing message (краткие заметки, не отдельный трек)

**Кто маркетит «local-first food/health tracker»:**
- **Bearable:** «Your data stays on your device. We encrypt it before backup. We can't see what you eat or how you feel.» — самая близкая к Disher trust-marketing формулировка. Они дают **anonymized user_id + email separation** — даже их own analytics не знают какой email привязан к каким симптомам.
- **Daylio:** «Daylio doesn't send data to its own servers.» — radical privacy. Юзеры видят это положительно (high ratings).
- **OpenNutriTracker:** «Your diary never leaves your device unless you decide otherwise.» «Privacy-first nutrition app you can hack on.» — open-source как trust signal.
- **FoodNoms:** «All data is stored on your device, allowing you to log food, view history, and track goals even without an internet connection.» + «Foodnoms automatically encrypts your food log... before uploading to iCloud.»

**Фразы которые работают (по reviews / blog content):**
- «Your data, your device»
- «Encrypted before it leaves your device»
- «No ads, no data selling, no subscriptions [+ if they have free tier]»
- «We can't see what you enter»
- «Works offline»

**Связка с инсайтом «короткая дистанция, найди паттерны»:**
- Bearable Free = 30-day window прямо позиционируется как «correlation finder, free». Это — референс маркетинга для нашего профиля. Disher может маркетить:
  - «Find what's affecting your mood this month»
  - «30 days of correlations, free forever»
  - «Your food story, day-to-day, not year-by-year»
- Контраст с MyFitnessPal-нарративом «track every calorie forever»: Disher — «понять, что влияет на тебя сейчас», не «накопить calorie history».

---

## Cross-cutting findings

1. **В нашей нише `multi-device sync` = решённая роскошь, не commodity.** 4 из 4 целевых apps либо обходят (single-device), либо платформозависимый sync (Apple-only через CloudKit), либо никогда не реализуют (OpenNutriTracker roadmap). **Disher с реальным cross-platform PWA backup-polling уже выше median по этому критерию.**

2. **Edit count > timestamp как pattern доминирует.** Apple HealthKit (sync_version), FoodNoms (edit_count), Joplin (revision counter — вне scope, но прецедент). **Backup-polling план в Disher должен включать `edit_count INT NOT NULL DEFAULT 0` per row** + ON CONFLICT по edit_count для устойчивости к clock skew. Это zero-cost замена `client_modified_at` ИЛИ дополнение (composite tie-breaker: edit_count first, then client_modified_at).

3. **«Encrypted backup ≠ sync» — валидный продуктовый компромисс.** Bearable @ 4.7-4.8★, 12k+ reviews, 6+ лет успешен **с одним устройством одновременно + cloud backup**. Это валидирует точно нашу backup-polling концепцию: цель = durability, не realtime collab.

4. **Single-developer / two-person team apps =  доминируют в нашей категории.** FoodNoms (Ryan), OpenNutriTracker (Simon), Daylio (Habitics — small team), Bearable (James + Kamil). Это **позитивный сигнал**: complex sync engines не нужны для успешного продукта в этой нише. Backup-polling proof-of-concept от 1 человека (Disher author) согласуется с industry shape.

5. **Server-first гиганты теряют data регулярно.** MFP corruption mar-2024, Cronometer 3-day Google Fit sync break, MFP web/Android desync feb-2026. **Local-first storey Disher = реальная фича, не маркетинг-фарш.**

6. **Schema migration в backup file есть везде.** Daylio — `Version` field. FoodNoms — поверх CoreData миграций. Подтверждает наш план — `version` колонка в snapshot/backup payload обязательна.

7. **«Manual export» как escape hatch ожидаем юзерами.** Daylio backup file (Base64 JSON) widely used. CSV export from FoodNoms. Это — must-have (см. наш `project_manual_export_idea.md`).

8. **Subscription paywall на extended history (>30 days) — проверенная модель.** Bearable делает. Если Disher когда-нибудь монетизируется, этот pattern уже валидирован у конкурента того же engagement-tier'а.

---

## Sources

- [Bearable home](https://bearable.app/)
- [Bearable: multiple devices support page](https://bearable.app/support/common-questions/can-i-use-bearable-on-multiple-devices/)
- [Bearable: same account on multiple devices issue](https://bearable.app/support/issues/using-the-same-bearable-account-on-multiple-devices/)
- [Bearable: syncing not working](https://bearable.app/support/troubleshooting/syncing-not-working-correctly/)
- [Bearable: I've lost my data](https://bearable.app/support/troubleshooting/ive-lost-my-data/)
- [Bearable: Free vs Premium features](https://bearable.app/support/common-questions/bearable-free-vs-premium-features/)
- [Bearable: pricing and principles](https://bearable.app/our-pricing-and-principles/)
- [Bearable: privacy policy](https://bearable.app/privacy-policy/)
- [Bearable App Review 2025 – ChoosingTherapy](https://www.choosingtherapy.com/bearable-app-review/)
- [Daylio home](https://daylio.net/)
- [Daylio: backup options](https://daylio.net/faq/docs/daylio-faq/backup/backup-options/)
- [Daylio: data security](https://daylio.net/faq/docs/daylio-faq/about/how-secure-is-my-data/)
- [Daylio: use multiple devices](https://daylio.net/faq/docs/daylio-faq/tutorials/using-multiple-devices/)
- [Daylio: move backup between iOS/Android](https://daylio.net/faq/docs/daylio-faq/backup/move-backup-between-ios-and-android/)
- [Reverse-engineering Daylio backups (Joel Otter)](https://www.joelotter.com/posts/2022/01/daylio/)
- [daylio-csv-parser (MichaelCurrin)](https://github.com/MichaelCurrin/daylio-csv-parser)
- [OpenNutriTracker GitHub](https://github.com/simonoppowa/OpenNutriTracker)
- [Building OpenNutriTracker (DEV.to interview)](https://dev.to/jeremy_libeskind_4bfdc99f/building-opennutritracker-a-privacy-first-nutrition-app-you-can-hack-on-2k9l)
- [FoodNoms home](https://foodnoms.com/)
- [Foodnoms vs MyFitnessPal](https://foodnoms.com/vs/myfitnesspal)
- [Foodnoms 2: Feature Overview](https://foodnoms.com/news/foodnoms-2)
- [Introducing Foodnoms Cloud](https://foodnoms.com/news/foodnoms-cloud)
- [Foodnoms blog](https://foodnoms.com/blog/)
- [Growing FoodNoms to $10K MRR](https://www.foodnoms.com/blog/growing-foodnoms-to-10k-mrr/)
- [Building a Crowdsourced Food Database (FoodNoms)](https://foodnoms.com/news/building-a-crowdsourced-food-database)
- [Ryan Ashcraft: What I Learned Writing My Own CloudKit Syncing Library](https://ryanashcraft.com/what-i-learned-writing-my-own-cloudkit-sync-library/)
- [CloudSyncSession GitHub (MIT)](https://github.com/ryanashcraft/CloudSyncSession)
- [Michael Tsai blog: CloudSyncSession](https://mjtsai.com/blog/2023/04/20/cloudsyncsession/)
- [HealthKit framework docs](https://developer.apple.com/documentation/healthkit/about-the-healthkit-framework)
- [Synchronize health data with HealthKit (WWDC20)](https://developer.apple.com/videos/play/wwdc2020/10184/)
- [Protecting access to user's health data (Apple)](https://support.apple.com/en-au/guide/security/sec88be9900f/web)
- [MyFitnessPal data corruption March 2024 (kamens.us blog)](https://blog.kamens.us/2024/03/27/myfitnesspal-is-not-telling-the-whole-truth-about-recent-data-corruption-incident/)
- [MFP forum: web/Android/WearOS out of sync](https://community.myfitnesspal.com/en/discussion/10956231/web-android-app-and-wearos-watch-versions-wildly-out-of-sync)
- [MFP forum: Lost all food history](https://community.myfitnesspal.com/en/discussion/10881399/lost-all-food-history-data)
- [MFP forum: app not syncing to web](https://community.myfitnesspal.com/en/discussion/10956206/app-not-syncing-to-web)
- [Cronometer forum: Offline Use](https://forums.cronometer.com/discussion/1094/offline-use)
- [Cronometer forum: Offline Mode (2022)](https://forums.cronometer.com/discussion/5147/offline-mode)
- [Cronometer forum: strategy for offline use](https://forums.cronometer.com/discussion/2405/strategy-for-offline-use)
- [Cronometer forum: Syncing stopped completely](https://forums.cronometer.com/discussion/4354/syncing-stopped-completely)
- [Cronometer forum: top issues / pet peeves](https://forums.cronometer.com/discussion/4127/what-are-your-top-issues-pet-peeves-with-cronometer)
- [OpenFoodFacts smooth-app GitHub](https://github.com/openfoodfacts/smooth-app)
- [OpenFoodFacts offline scanning issue #18](https://github.com/openfoodfacts/smooth-app/issues/18)
- [awesome-quantified-self (woop)](https://github.com/woop/awesome-quantified-self)
- [awesome-quantified-self (markwk)](https://github.com/markwk/awesome-quantified-self)
- [MoodMo open-source mood tracker](https://github.com/dnlzrgz/moodmo)
- [Reflectly App Review 2025](https://ikanabusinessreview.com/2025/10/reflectly-app-review-2025-guided-journaling-for-wellbeing/)
- [Stoic app](https://www.getstoic.com/)
- [Welltory data sources](https://help.welltory.com/en/articles/11130907-data-sources-and-how-to-connect-them)
- [James Saady — Bearable founder profile](https://techround.co.uk/interviews/meet-james-saady-founder-bearable/)
