---
name: critique
description: Войти в Critique-режим — 7 проходов code review (PASS 0.5 → 5), найти баги/feature gaps/конкретные нарушения концепта
type: prompt
whenToUse: Когда юзер просит критику/ревью фичи, файла или ветки — найти реальные баги, feature gaps, нарушения concept doc, semantic test gaps, а не просто прогнать typecheck
arguments:
  - scope
---

Юзер инициирует **Critique-режим**. Аргумент — scope ревью: имя файла, путь, имя фичи, или пусто (тогда ревьюим current branch vs `main`).

**Цель скилла:** не «type-check зелёный = готово». Найти реальные баги: feature gaps, нарушения concept doc, edge cases которые не обработаны, semantic test gaps, корявые контракты на стыках файлов. **Tests + types ловят assembly; этот скилл ловит semantics.**

**Pre-flight:**
1. Определи scope (первый позиционный аргумент, если передан):
   - Аргумент = путь → ревьюим этот файл / папку.
   - Аргумент = название фичи → найди `apps/food-calc/tds/<feature>.md` (или ближайший) + соответствующие файлы кода.
   - Пусто → `git diff main...HEAD --stat` → ревьюим все изменённые файлы текущей ветки.
2. Прочитай `AGENTS.md` (и `apps/food-calc/CLAUDE.md` для фронтенда) — там инварианты, каноны и hard rules проекта.
3. Если есть concept doc / TDS для фичи — прочитать **целиком**, выписать в голове ключевые инварианты.

### PASS 0.5 — Clarify intent (перед всеми остальными)

Прежде чем выкатить претензии — посмотри на код глазами «специально или баг?». Если есть **1–3 подозрительных места**, где это могло быть осознанным выбором юзера (а не упущением), задай **один** AskUserQuestion с 2–3 candidate местами:

> «Перед критикой уточню — это специально?»
> - Опция 1: `<file:line>` — `<паттерн>` (например: «нет retry на 5xx — намерение или баг?»)
> - Опция 2: `<file:line>` — `<паттерн>`
> - Опция 3: «всё перечисленное специально, дальше критикуй»

**Skip PASS 0.5** если:
- Код явно противоречит явно процитированной спецификации.
- Все потенциальные «специально» места уже подкреплены документацией / спецификацией / комментарием.
- Юзер сам в запросе сказал «знаю что X, не трогай X — критикуй остальное».

Записывай ответы юзера — они становятся фильтром для последующих pass'ов (не лепить претензии на одобренные намерения).

### PASS 0 — Web research 2026

Для каждой external интеграции в scope (LLM API, fetch retry, auth flow, markdown render, body limits, JSON parse, file upload, WebSocket, etc.):
- WebSearch: «<technology> 2026 best practice <topic>»
- Сравни **в одну строку**: «индустрия 2026: X. У нас: Y. Дельта: Z».

**До чтения собственного кода.** Чтобы внешний якорь не зависел от наших предположений.

### PASS 1 — Concept as live checklist

Если есть concept doc / spec / TDS:
- Пройди по нему **построчно**.
- Каждую явную инвариантную фразу («система должна X», «никогда Y», «§4 говорит Z») — найди в коде через Grep.
- Зацитируй: «§X.Y plan: <фраза> → impl: <file:line> → совпадает / нарушается».

Концепт-нарушения чаще всего буквально зацитированы в спеке. Это самый плотный источник багов.

### PASS 2 — User-flow simulation

Прокрути в голове **один** конкретный сценарий по шагам:
- Юзер кликает X
- → state в idb-keyval / Dexie меняется как: ...
- → HTTP body содержит: ...
- → backend парсит как: ...
- → LLM получает: ...
- → response payload содержит: ...
- → UI после reload показывает: ...

На каждой стрелке спроси «что может потеряться / переименоваться / race'нуться». Один сценарий ≈ 5 потенциальных багов. Race conditions, ownership transfers через onClose, orphan записи всплывают именно здесь.

### PASS 3 — «I am the LLM / external system»

Получив payload/запрос/state, который наш код отправляет наружу: что я физически **могу** извлечь и сделать?
- LLM получает UUIDы вместо имён? → не может анализировать паттерны.
- Backend получает `{}` где ожидает `{user, dish}`? → 400 / тихий ноль.
- WebSocket subscribe без auth header? → server закроет на handshake.

Структурно payload может быть валидным, тесты зелёные — а фича функционально мёртвая.

### PASS 4 — Semantic test gaps

Существующие тесты — **что они НЕ проверяют?** Каноничные пробелы:
- shape наружного payload'а («mock fetch'ed N times» vs «body содержит human-readable `name`»)
- content системного промпта (assert на «нет противоречий», «строки 1–3 vs 0 согласованы»)
- корректность поля фильтра (`r.date` vs `r.updated_at`)
- empty-result handling (`resultMd === ''` rejects?)
- truncation границы (UTF-16 surrogate pairs?)
- error path (5xx → retry happens?)

Не «написать тесты», а **перечислить** что не покрыто. Решение писать или нет — юзер.

### PASS 5 — Self-audit (последним, не вместо)

Только сейчас:
- `pnpm typecheck` / lint / тесты (через turbo, не голым tsc)
- `git diff main...HEAD` — построчно по своим коммитам, нет ли регрессий
- Migration / config / OpenAPI drift

**Если PASS 5 нашёл больше багов чем PASS 0-4 — это сигнал что я начал self-audit первым. Не должно случаться.**

### Итоговый отчёт юзеру

Формат:
```markdown
## Critique report (<YYYY-MM-DD>)
Scope: <что ревьюил>

### 🚨 Show-stoppers (фича функционально не работает)
- <bug> — `file:line` — <как воспроизвести / что не так>

### ⚠️ Bugs (фича работает, но криво / edge case ломает)
- <bug> — `file:line` — <impact>

### 📋 Concept violations (нарушение spec/TDS §X)
- <violation> — `file:line` — `<spec quote>`

### 🧪 Test gaps (assembly OK, semantics не покрыты)
- <gap> — какой тест бы поймал

### 💭 Discussion (не баг, но архитектурный вопрос)
- <вопрос> — почему сейчас так, стоит ли менять

### ✅ Sanity-check
- typecheck: <status>
- tests: <status>
- diff sanity: <одна строка>
```

Каждый bullet — **actionable** (file:line или цитата). Без `file:line` — не bug, а нытьё.

**Чего НЕ делать:**

- Не начинать с self-audit. PASS 5 — последним. Иначе anchor на «не сломал ли я свои коммиты» вместо «работает ли feature».
- Не пропускать PASS 0 (web research). Внешний baseline часто высвечивает баги до чтения собственного кода.
- Не лить размытое «возможно, стоит подумать про X». Либо `file:line` + impact, либо в Discussion-секцию явно.
- Не повторять PASS 0.5 в каждый последующий pass — это **front-load** intent-сверка, не постоянный режим.
- Не делать full audit на trivial-правки. Если scope = «1 файл, 30 строк, явный fix» — достаточно diff-review + PASS 2 (flow simulation). Скажи юзеру что свернул pipeline.

ARGUMENTS: $scope
