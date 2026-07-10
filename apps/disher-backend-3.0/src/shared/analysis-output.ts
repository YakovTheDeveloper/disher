// Single source of truth for the LLM analysis contract — prompt spec + output
// type + parser. Every place that touches the LLM JSON contract imports from
// here. Drift between prompt and parser is the bug class this module exists
// to prevent (Bugs 12, 13, 18, 22, 23 in the original review).
//
// Frontend reads `idea_cards` jsonb via mapAnalysisRow + asIdeaCards in
// food-calc/src/entities/analysis/api/mappers.ts. The frontend mapper is
// permissive (drops malformed cards, defaults missing fields) — keep the
// IdeaCard shape here and the asIdeaCards filter in sync.

// ─── Output entities ───
// THREE distinct things the analysis emits, deliberately separate buckets:
//   • observation — a neutral regularity the model SAW in the data. Read-only,
//                   not the user's to keep — pure reference. NO valence (it makes
//                   no good/bad claim). The anti-hallucination lever (grounded
//                   evidence) still applies.
//   • insight     — a takeaway ABOUT the user that is good or bad and worth
//                   remembering: a lucky/unlucky combination, a nutrient synergy
//                   or antagonism. ALWAYS carries a valence (positive|negative);
//                   the user can save it to themselves. A neutral "insight" is a
//                   category error — it is really an observation, and the parser
//                   demotes it.
//   • hypothesis  — a testable mini-experiment the user can save to themselves
//                   (this is the former `ideaCard`, renamed to its real meaning).
// `summary` is a 1–2 sentence overview persisted into analyses.result_md so the
// existing pending('')/failed('⚠️…') sentinels on that column keep working.

export type AnalysisStrength = "weak" | "moderate" | "clear";

// Whether an insight reads as a good thing or a bad thing. ORTHOGONAL to
// `strength` (confidence) — a "clear" insight can be negative. "neutral" is only
// a coercion fallback / observation marker: a neutral finding is an observation,
// not an insight, so the parser never KEEPS a neutral insight (it demotes it).
export type AnalysisValence = "positive" | "negative" | "neutral";

export type AnalysisEvidence = {
  days: string[]; // concrete day keys from the window — non-empty for an insight
  foods?: string[];
  events?: string[];
};

// A neutral pattern for reference. Same shape as an insight MINUS valence — it
// makes no good/bad claim, so there is no valence field to misread.
export type AnalysisObservation = {
  title: string;
  detail: string;
  strength: AnalysisStrength;
  evidence: AnalysisEvidence;
};

export type AnalysisInsight = {
  title: string;
  detail: string;
  valence: AnalysisValence;
  strength: AnalysisStrength;
  evidence: AnalysisEvidence;
};

export type AnalysisHypothesis = {
  title: string;
  body: string;
  suggestedDays?: number;
};

export type AnalysisOutput = {
  summary: string;
  observations: AnalysisObservation[];
  insights: AnalysisInsight[];
  hypotheses: AnalysisHypothesis[];
};

// Inline JSON contract embedded in the system prompt. Whatever this string
// describes is what tryParseOutput expects to receive — both sides must move
// together. The contract test feeds historical / fixture LLM responses into
// tryParseOutput so a prompt change that breaks the parser fails CI.
export const ANALYSIS_OUTPUT_PROMPT_SPEC = `Верни строго JSON и НИЧЕГО кроме JSON:
{
  "reasoning": "Черновик рассуждений — в ответ юзеру НЕ показывается. Здесь думай широко: перебери кандидатов-связок по ВСЕМ осям (еда, состав/нутриенты, время и ритм приёмов, события, сочетания двух факторов), прикинь на скольких днях окна каждая держится и держится ли в контр-днях (дни без этой еды / без этого симптома), отметь возможный лаг (симптом мог отстать от еды на часы-сутки). Что отсеял как единичное совпадение — тоже отметь. В блоки ниже клади только то, у чего есть опора в данных.",
  "summary": "1–2 фразы: общая картина окна простым языком. Без диагнозов.",
  "observations": [
    {
      "title": "Короткий заголовок наблюдения",
      "detail": "Что именно замечено, одним-двумя предложениями. Нейтрально, без оценки.",
      "strength": "weak | moderate | clear",
      "evidence": {
        "days": ["09-06-2026", "10-06-2026"],
        "foods": ["паста карбонара"],
        "events": ["усталость"]
      }
    }
  ],
  "insights": [
    {
      "title": "Короткий заголовок инсайта",
      "detail": "Чем именно это полезно или вредно, одним-двумя предложениями.",
      "valence": "positive | negative",
      "strength": "weak | moderate | clear",
      "evidence": {
        "days": ["09-06-2026"],
        "foods": ["говядина", "болгарский перец"]
      }
    }
  ],
  "hypotheses": [
    { "title": "Короткое название гипотезы", "body": "почему стоит проверить и как тестировать", "suggestedDays": 7 }
  ]
}

Три РАЗНЫХ блока — не путай их:
- observations (наблюдения) — нейтральные закономерности, которые ты УВИДЕЛ в данных: «что есть», просто справка. Без оценки «хорошо/плохо», без совета. У наблюдения НЕТ поля valence.
- insights (инсайты) — выводы ПРО ЮЗЕРА, у которых есть явная польза или вред и которые стоит запомнить: удачные/неудачные сочетания, синергии и антагонизмы нутриентов. У КАЖДОГО инсайта valence ОБЯЗАТЕЛЬНО "positive" (полезно) или "negative" (вредно) — нейтральных инсайтов НЕ бывает, нейтральное это наблюдение.
- hypotheses (гипотезы) — что юзеру стоит проверить дальше, мини-эксперименты.

Как выбрать между наблюдением и инсайтом: спроси себя «это просто факт/закономерность для справки — или это полезно/вредно для юзера и стоит запомнить?». Факт без оценки → observation. Польза или вред → insight (с valence).

Ищи как можно больше связей — но каждую с опорой. Прочеши ВСЕ оси, не останавливайся на первых двух-трёх находках: одиночные продукты, состав/нутриенты, время и ритм приёмов, события, и особенно СОЧЕТАНИЯ двух факторов (еда+еда, еда+время, еда+контекст события). Слабую, но реальную связку (на одном-двух днях) НЕ выкидывай молча — выдай её как находку со strength "weak". Отбрасывай только то, под чем нет вообще никакой опоры в данных. Лучше выдать 5 честно размеченных находок (часть "weak"), чем 2.

Правила:
- reasoning — сначала заполни его (внутренний черновик, юзеру не показывается): перебери кандидатов по всем осям и отсей необоснованные. Потом на его основе заполни блоки ниже. reasoning в блоки не дублируется.
- summary — всегда непустой. Если данных мало для выводов — так и напиши в summary, а observations/insights/hypotheses оставь пустыми.
- observations — 0–6. У КАЖДОГО поле evidence обязательно с опорой в данных: evidence.days (реальные дни окна) ИЛИ evidence.foods (продукты). foods/events — ключевые еда/события. Нет опоры — не выдумывай наблюдение.
- insights — 0–6. У КАЖДОГО valence ("positive"/"negative") И evidence (days или foods) ОБЯЗАТЕЛЬНЫ. Нет опоры — не выдумывай связку.
- strength: уверенность в находке. "clear" только при явном повторе (примерно ≥40% дней окна или сильная связка, устойчивая и в контр-днях), единичное совпадение — "weak", промежуточное — "moderate". valence (хорошо/плохо) и strength (уверенность) — разные оси. Низкая уверенность — это НЕ повод молчать, это повод поставить "weak".
- hypotheses — 0–5 независимых, каждая как мини-эксперимент: что проверить и как. Хорошая гипотеза рождается из слабой (weak) связки, которую стоит подтвердить. suggestedDays — опциональное рекомендованное окно проверки в днях.
- Без медицинских советов и диагнозов нигде. Без комментариев и markdown-заборов вокруг JSON.
- ЯЗЫК: весь текст в значениях полей (summary, title, detail, body) — СТРОГО на русском языке. Никакого английского в тексте для юзера, даже если в данных встречаются английские слова. Ключи JSON и enum-значения (weak/moderate/clear, positive/negative) — как в спецификации, их не переводи.`;

// Insights don't have to come from food↔event correlations — they can come from
// the FOOD ITSELF: nutrient synergies and antagonisms in what was eaten (iron +
// vitamin C → better absorption; calcium blocks iron absorption; etc). Such
// compositional findings are good/bad by nature, so they are INSIGHTS (carry a
// valence), grounded by `evidence.foods` (the products involved); `evidence.days`
// may be empty — the relaxed grounding gate in tryParseOutput lets a foods-only
// insight through. Append this to a system prompt that wants compositional
// insights (daily / period / dish).
export const ISOLATED_FOOD_INSIGHT_INSTRUCTION = `Ищи инсайты не только в связке «еда↔событие», но и в САМОМ составе еды: синергии и антагонизмы нутриентов. Пройдись по этому чек-листу известных взаимодействий и проверь, встречались ли пары в одном приёме/дне:
— витамин C усиливает усвоение НЕгемового железа (растит. железо + перец/цитрус/зелень) → positive;
— кальций (молочка) в одном приёме с железом мешает его усвоению → negative;
— фитаты (цельные злаки, бобовые, орехи), оксалаты (шпинат, свёкла, щавель) и танины (чай, кофе) связывают железо/цинк/кальций/магний → negative;
— жирорастворимые витамины (A, D, E, K) и каротиноиды усваиваются заметно лучше с жирами в том же приёме → positive; те же продукты без жира → упущенная польза;
— цинк и медь конкурируют: систематический перекос в сторону цинка мешает меди → negative;
— медь нужна для транспорта железа; цинк нужен для переноса витамина A → синергии;
— фолат и B12 работают в паре; белок (гистидин) улучшает усвоение кальция и цинка → positive.
Это ориентиры, а не полный список — замеченную не из чек-листа связку тоже выдавай. Это именно ИНСАЙТЫ (полезно/вредно), а не нейтральные наблюдения: у каждого valence ОБЯЗАТЕЛЬНО ("positive" — удачная связка, "negative" — мешающая) и evidence.foods ОБЯЗАТЕЛЬНО (продукты, о которых речь), а evidence.days может быть пустым — связка по составу не привязана к конкретному дню.`;

// Each schedule_food carries a `details` string — comma-separated free-text
// tags the user attached to the meal (способ готовки, выдержка, источник,
// маринад, кожура, …). The cohort-building paragraph below tells the LLM how
// to mine it. Single-mention tokens are not patterns — we want at least ~20%
// of days in the window before calling something a cohort.
const DETAILS_COHORT_INSTRUCTION = `Каждый приём пищи может иметь поле details (строка через запятую: «жареное, без масла», «выдержанный», «домашнее», «с кожурой» и т.п.). Прочти details всех приёмов окна. Выдели повторяющиеся оси (способ готовки, источник, выдержка, кожура, маринад) и стройте когорты — например «жареные дни» vs «варёные дни», «домашнее» vs «магазинное». Минимум для когорты — присутствие в ≥20% дней окна; единичные упоминания не паттерн. Если ось встречается слишком редко, не натягивай её на разбор.`;

// Events arrive as JSON: each has `text` (free-form description of how the user
// felt / what they noted) and optionally `atoms` — currently scale ratings
// (`{kind:"scale", value:1–10, label:"Боль"}`). The user writes the phenomenon
// AND often its suspected cause directly into `text`; the model must mine that
// prose, cluster it across days, and treat user-stated causes as hypotheses —
// not facts. This is the events-side mirror of DETAILS_COHORT_INSTRUCTION; it
// exists because events used to be dumped as raw JSON with no reading guidance.
const EVENTS_MINING_INSTRUCTION = `События юзера приходят с полем text (свободное описание самочувствия/состояния) и иногда с атомами-оценками (шкала 1–10 с ярлыком явления, напр. «Боль» 7/10). Прочти text всех событий окна. Кластеризуй повторяющиеся явления, даже если в разные дни они названы по-разному («болит голова» ≈ «мигрень» ≈ «тяжёлая голова») — для корреляции это один ряд. В тексте юзер часто сам называет предполагаемую причину («болела голова из-за недосыпа», «бодрость после кофе») — это ГИПОТЕЗА юзера, а не факт: взвешивай её против реальной еды окна, не принимай на веру и не повторяй как готовый вывод. Шкальные оценки — это сила явления: учитывай величину (7/10 vs 3/10), а не только факт, что событие было. Минимум для паттерна — повтор примерно в ≥20% дней окна; единичное явление не паттерн.`;

// Food→symptom effects are frequently DELAYED (research on food/symptom diaries
// puts the lag anywhere from a couple hours to ~2 days). A weekly analyzer that
// only pairs same-day food with same-day symptoms misses most real links. This
// instruction tells the model to look across the day boundary and at cumulative
// load over consecutive days — the single biggest yield lever for a multi-day
// window. Weekly-only (a 1-day window has no cross-day carryover).
const TEMPORAL_LAG_INSTRUCTION = `Учитывай ЗАДЕРЖКУ: реакция на еду часто отстаёт — от нескольких часов до 1–2 суток. Не ограничивайся связками «еда и симптом в один день»: смотри и на переход через ночь (поздний ужин → самочувствие утром), и на накопление за несколько дней подряд (напр. несколько дней подряд с одним продуктом → симптом к концу серии). Где связка правдоподобна с лагом — так и опиши в detail («симптом на следующий день после…»), а дни-опоры в evidence.days указывай реальные (и день еды, и день симптома, если оба в окне).`;

// The contrast (counterfactual) method: a co-occurrence is only a real signal if
// the symptom is rarer WITHOUT the food (and/or the food usually brings the
// symptom). Making the model check the opposite days both filters coincidences
// AND surfaces more genuine links it would otherwise overlook — it's a
// yield-and-quality lever, not just a guard. Weekly-only (needs multiple days to
// contrast).
const CONTRAST_METHOD_INSTRUCTION = `Каждую подозреваемую связку «еда↔событие» проверяй контрастом: сравни дни С этим продуктом и дни БЕЗ него. Связка правдоподобна, если в дни без продукта симптом заметно реже (или его нет), и/или почти каждый день с продуктом идёт с симптомом. Если симптом одинаково часто и с продуктом, и без — это, скорее всего, совпадение: понижай strength или переводи в гипотезу. Контраст помогает не только отсеивать ложное, но и находить неочевидное — прогоняй через него разных кандидатов, а не только первого.`;

// ─── Nutrient anchor ───
// The client computes approximate per-day nutrient sums (from the catalog) and
// ships them as an anchor. They are NOT a calculator readout for the user — the
// instruction below tells the LLM to treat them as rough calibration only.

export type NutrientLine = {
  name: string;
  amount: number;
  unit: string;
  norm: number | null;
};

// Coerce arbitrary client JSON into NutrientLine[]. Permissive: drops malformed
// entries rather than throwing, mirrors the rest of this module's contract.
export function asNutrientLines(v: unknown): NutrientLine[] {
  if (!Array.isArray(v)) return [];
  const out: NutrientLine[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.name !== "string") continue;
    if (typeof o.amount !== "number" || !Number.isFinite(o.amount)) continue;
    const unit = typeof o.unit === "string" ? o.unit : "";
    const norm =
      typeof o.norm === "number" && Number.isFinite(o.norm) ? o.norm : null;
    out.push({ name: o.name, amount: o.amount, unit, norm });
  }
  return out;
}

// One nutrient → a compact token, e.g. «Белки 95 г (норма ~51)». Used inline
// (long, per-day) and as bullets (daily).
export function nutrientLineToken(n: NutrientLine): string {
  const base = `${n.name} ${n.amount} ${n.unit}`.trim();
  return n.norm !== null ? `${base} (норма ~${n.norm})` : base;
}

export const NUTRIENT_ANCHOR_INSTRUCTION = `К данным приложены ОРИЕНТИРОВОЧНЫЕ суммы нутриентов за день — посчитаны автоматически из каталога по съеденным продуктам и порциям. Они приблизительные: часть продуктов может быть без данных, состав и порции варьируются. Используй их ТОЛЬКО как опору: грубо прикинуть, чего за день могло быть заметно мало или много относительно ориентира суточной нормы, и не предлагать абсурдных количеств. НЕ зачитывай эти числа юзеру как точные и НЕ превращай ответ в таблицу БЖУ — говори о тенденциях («белка в эти дни заметно ниже ориентира»), а не «у вас было ровно 73.4 г белка». Если по нутриентам данных нет — просто не упоминай их.`;

// Dish names may carry a bracket-tag with per-ingredient modifications, e.g.
// `Борщ [особенности: свёкла печёная, говядина тушёная 2ч]`. This is the
// dish's own «recipe variation», not a tag on the meal — treat it as part
// of what the dish *is* on that day.
export const DISH_DETAILS_INSTRUCTION = `Если имя блюда содержит хвост вида «[особенности: …]», это перечень модификаций ингредиентов в этом конкретном приготовлении блюда (способ готовки, замена, выдержка). Учитывай их как составную часть блюда, а не как отдельные теги приёма.`;

export const SYSTEM_PROMPT_BASE = `Ты помогаешь юзеру в его персональной лаборатории еды и симптомов.
На вход — события юзера за окно (приёмы пищи + теги/события) и, опционально,
гипотезы, которые юзер хочет проверить. Задача: на русском дать короткий summary
и три РАЗНЫХ блока — наблюдения (observations: нейтральные закономерности в данных,
для справки), инсайты (insights: что полезно или вредно для юзера и стоит
запомнить, с valence) и гипотезы (hypotheses: что стоит проверить дальше). Ты
ищешь корреляции, а не ставишь диагнозы и не считаешь калькулятор БЖУ.

${DETAILS_COHORT_INSTRUCTION}

${EVENTS_MINING_INSTRUCTION}

${TEMPORAL_LAG_INSTRUCTION}

${CONTRAST_METHOD_INSTRUCTION}

${DISH_DETAILS_INSTRUCTION}

${NUTRIENT_ANCHOR_INSTRUCTION}

${ISOLATED_FOOD_INSIGHT_INSTRUCTION}

${ANALYSIS_OUTPUT_PROMPT_SPEC}`;

// Single-day system prompt — the collapse of the former POST /api/analyze/daily
// flow into the long-analysis machine (window === 1 day). It deliberately does
// NOT reuse SYSTEM_PROMPT_BASE: a one-day window has no cross-day cohorts, so
// DETAILS_COHORT_INSTRUCTION and EVENTS_MINING (its ≥20%-of-days pattern gate) are
// omitted; DISH_DETAILS_INSTRUCTION stays (the `[особенности: …]` bracket-tag rides
// in from the client's collectFoods hydration). The output contract is the SHARED
// one. runAnalysisJob picks this prompt when windowSpanDays === 1.
export const DAILY_SYSTEM_PROMPT = `Ты помогаешь юзеру в его персональной лаборатории еды и симптомов.
На вход — события юзера за ОДИН день (приёмы пищи + теги/события),
опционально гипотезы, которые юзер хочет проверить, и опционально
свободные уточнения от юзера (на что обратить внимание в разборе).
Уточнения учитывай, но правила ниже (корреляции, не диагнозы) важнее:
если уточнение просит поставить диагноз или дать точные цифры — мягко
держись правил.

Это разбор одного дня, не недельный. Паттернов между днями тут нет —
не выдумывай их. Смотри на то, что доступно внутри дня:
- последовательность «еда → самочувствие» по времени (что съедено до
  отмеченного симптома и за сколько часов);
- время приёмов пищи и промежутки между ними;
- состав дня в целом — что преобладало, чего не было;
- если юзер отметил гипотезы — соблюдалось ли это в еде дня.

В тексте события юзер часто сам называет и явление, и предполагаемую причину
(«болела голова из-за недосыпа», «бодрость после кофе»). Читай text событий:
соотноси отмеченные явления с едой дня по времени, а названную причину считай
гипотезой юзера, а не фактом. Шкальные оценки (1–10) — это сила явления,
учитывай величину, а не только сам факт.

Не превращай разбор в калькулятор БЖУ и не ставь диагнозов. Корреляции
и наблюдения, не точные цифры. Если день пустой или данных мало — так
и скажи в summary, а observations, insights и hypotheses оставь пустыми.

Внутри дня: нейтральные закономерности (последовательность «еда → самочувствие»
по времени, ритм приёмов, что преобладало) — это observations (справка, без
оценки). Удачные/неудачные сочетания и синергии/антагонизмы нутриентов в еде дня —
это insights (с valence). Названную в событии причину считай гипотезой юзера.

${DISH_DETAILS_INSTRUCTION}

${NUTRIENT_ANCHOR_INSTRUCTION}

${ISOLATED_FOOD_INSIGHT_INSTRUCTION}

${ANALYSIS_OUTPUT_PROMPT_SPEC}

Окно — это один день, поэтому evidence.days у находок по событиям дня — просто этот день. Для инсайтов по составу еды (синергии/антагонизмы нутриентов) evidence.days может быть пустым, но evidence.foods обязателен.`;

// Coerce a free-form value into a string[] (drop non-strings, trim, drop empties).
function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const s = item.trim();
    if (s) out.push(s);
  }
  return out;
}

// Unknown strength coerces to "weak" rather than dropping the whole finding.
function coerceStrength(v: unknown): AnalysisStrength {
  return v === "clear" || v === "moderate" ? v : "weak";
}

// The grounding contract is enforced HERE, not only in the prompt: a finding
// with NO days AND NO foods behind it is DROPPED — a claim with nothing concrete
// behind it is exactly the hallucination this feature exists to suppress. A
// compositional insight (nutrient synergy/antagonism) is grounded by foods
// alone, so days may be empty for it. Returns null when ungrounded.
function coerceEvidence(o: Record<string, unknown>): AnalysisEvidence | null {
  const ev = (o.evidence ?? {}) as Record<string, unknown>;
  const days = asStringList(ev.days);
  const foods = asStringList(ev.foods);
  if (days.length === 0 && foods.length === 0) return null;
  const evidence: AnalysisEvidence = { days };
  if (foods.length > 0) evidence.foods = foods;
  const events = asStringList(ev.events);
  if (events.length > 0) evidence.events = events;
  return evidence;
}

// Permissive observation coercion — title+detail required, grounded evidence
// required, strength coerced. No valence: an observation makes no good/bad claim.
function asObservations(v: unknown): AnalysisObservation[] {
  if (!Array.isArray(v)) return [];
  const out: AnalysisObservation[] = [];
  for (const c of v) {
    if (!c || typeof c !== "object" || Array.isArray(c)) continue;
    const o = c as Record<string, unknown>;
    if (typeof o.title !== "string" || typeof o.detail !== "string") continue;
    const evidence = coerceEvidence(o);
    if (!evidence) continue;
    out.push({
      title: o.title,
      detail: o.detail,
      strength: coerceStrength(o.strength),
      evidence,
    });
  }
  return out;
}

// Permissive insight coercion. An insight is good/bad BY DEFINITION — it must
// carry a valence of "positive" or "negative". A neutral (or missing/unknown)
// valence means the model misfiled an observation as an insight, so we DEMOTE it
// to the observations bucket rather than keep a contradiction. Returns both the
// kept insights and the demoted observations so the buckets stay clean even when
// the model gets the split wrong. Grounding gate applies (days OR foods).
function asInsightsSplit(v: unknown): {
  insights: AnalysisInsight[];
  demoted: AnalysisObservation[];
} {
  const insights: AnalysisInsight[] = [];
  const demoted: AnalysisObservation[] = [];
  if (!Array.isArray(v)) return { insights, demoted };
  for (const c of v) {
    if (!c || typeof c !== "object" || Array.isArray(c)) continue;
    const o = c as Record<string, unknown>;
    if (typeof o.title !== "string" || typeof o.detail !== "string") continue;
    const evidence = coerceEvidence(o);
    if (!evidence) continue;
    const strength = coerceStrength(o.strength);
    if (o.valence === "positive" || o.valence === "negative") {
      insights.push({
        title: o.title,
        detail: o.detail,
        valence: o.valence,
        strength,
        evidence,
      });
    } else {
      demoted.push({ title: o.title, detail: o.detail, strength, evidence });
    }
  }
  return { insights, demoted };
}

// Permissive hypothesis coercion (the former ideaCard). title+body required;
// suggestedDays kept only when a positive finite number.
function asHypotheses(v: unknown): AnalysisHypothesis[] {
  if (!Array.isArray(v)) return [];
  const out: AnalysisHypothesis[] = [];
  for (const c of v) {
    if (!c || typeof c !== "object" || Array.isArray(c)) continue;
    const o = c as Record<string, unknown>;
    if (typeof o.title !== "string" || typeof o.body !== "string") continue;
    const h: AnalysisHypothesis = { title: o.title, body: o.body };
    if (
      typeof o.suggestedDays === "number" &&
      Number.isFinite(o.suggestedDays) &&
      o.suggestedDays > 0
    ) {
      h.suggestedDays = o.suggestedDays;
    }
    out.push(h);
  }
  return out;
}

// Permissive parser. LLM occasionally:
//  - wraps JSON in ```json ... ``` markdown fence (despite system prompt)
//  - emits trailing commentary after closing brace
//  - returns insights/hypotheses with extra fields, missing strength, etc.
//
// Contract: returns null only if structurally unsalvageable (no string
// summary). Returns a well-typed AnalysisOutput otherwise — malformed entries
// are dropped, not turned into runtime crashes downstream.
export function tryParseOutput(content: string): AnalysisOutput | null {
  let jsonStr = content.trim();

  // Strip markdown fence: ```json {...} ``` or ``` {...} ```. Match the
  // first fence — if there are multiple, the LLM is broken anyway.
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  // Trailing commentary: find the outermost JSON object by counting braces.
  // If the LLM emitted `{...}\n\nдополнительно: ...` we still parse cleanly.
  if (jsonStr.startsWith('{')) {
    let depth = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;
    for (let i = 0; i < jsonStr.length; i++) {
      const ch = jsonStr[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { endIdx = i + 1; break; }
      }
    }
    if (endIdx > 0) jsonStr = jsonStr.slice(0, endIdx);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.summary !== 'string') return null;

  // Split insights into kept (valenced) + demoted (neutral → observation), then
  // fold the demoted ones into the observations bucket. Explicit observations
  // first, demoted insights after, each preserving the model's order.
  const { insights, demoted } = asInsightsSplit(obj.insights);
  return {
    summary: obj.summary,
    observations: [...asObservations(obj.observations), ...demoted],
    insights,
    hypotheses: asHypotheses(obj.hypotheses),
  };
}

// Safe array truncation for prompt payload. Replaces the old
// `JSON.stringify(arr).slice(0, N)` pattern that produced invalid JSON
// (truncated mid-string → LLM sees garbage).
//
// Strategy: stringify each element, accumulate until the budget would be
// exceeded, return the prefix array as a valid JSON string. Items are
// dropped from the END (most recent kept if `keepEnd` is true).
//
// Returns the JSON string + dropped count for prompt-side disclosure.
export function safeStringifyArray(
  arr: readonly unknown[],
  byteBudget: number,
  opts: { keepEnd?: boolean } = {},
): { json: string; kept: number; dropped: number } {
  if (arr.length === 0) return { json: '[]', kept: 0, dropped: 0 };
  if (byteBudget < 4) return { json: '[]', kept: 0, dropped: arr.length };

  // Encode all items once.
  const encoded: string[] = [];
  for (const item of arr) {
    try {
      encoded.push(JSON.stringify(item));
    } catch {
      encoded.push('null');
    }
  }

  // Greedy fill from the chosen end. `[`, `]`, and `,` separators count.
  // Budget = 2 (brackets) + sum(item) + (count - 1) for separators.
  const indices = opts.keepEnd
    ? Array.from({ length: encoded.length }, (_, i) => encoded.length - 1 - i)
    : Array.from({ length: encoded.length }, (_, i) => i);

  let used = 2; // brackets
  const taken: number[] = [];
  for (const idx of indices) {
    const sep = taken.length === 0 ? 0 : 1;
    const cost = encoded[idx].length + sep;
    if (used + cost > byteBudget) break;
    used += cost;
    taken.push(idx);
  }
  taken.sort((a, b) => a - b);

  const json = '[' + taken.map((i) => encoded[i]).join(',') + ']';
  return { json, kept: taken.length, dropped: arr.length - taken.length };
}

// ─── Critic stage (experimental, gated by ANALYSIS_CRITIC) ───
// A second, CHEAP pass by a DIFFERENT model that audits the generator's draft
// for over-claimed / spurious correlations — the one failure mode this feature
// actually has (the generator is told to cast wide, so it over-produces, not
// under-produces). The critic returns ONLY verdicts (keep / drop / downgrade)
// keyed by a stable draft id; the PATCH is applied in code (applyCriticVerdicts),
// so the critic can never hallucinate a new finding — it can only prune or
// soften. Research 2026 note: multi-agent *debate* risks "factual attrition" for
// grounded tasks like this; a single skeptic-filter in a fresh context (no
// confirmation bias) is the cheap, safe lever. Observations get ids o0…, insights
// i0…; hypotheses and summary are out of scope (speculative / narrative).

export type CriticAction = "keep" | "drop" | "downgrade";

export type CriticVerdict = {
  id: string; // "o<idx>" | "i<idx>", matching serializeDraftForCritic
  action: CriticAction;
  strength?: AnalysisStrength; // target strength for a downgrade (never raises)
  reason?: string; // internal, not shown to the user
};

// Confidence ordering — a downgrade may only LOWER strength, never raise it.
const STRENGTH_RANK: Record<AnalysisStrength, number> = {
  weak: 0,
  moderate: 1,
  clear: 2,
};

function evidenceLine(ev: AnalysisEvidence): string {
  const parts: string[] = [];
  if (ev.days.length) parts.push(`дни: ${ev.days.join(", ")}`);
  if (ev.foods?.length) parts.push(`еда: ${ev.foods.join(", ")}`);
  if (ev.events?.length) parts.push(`события: ${ev.events.join(", ")}`);
  return parts.join("; ") || "нет опоры";
}

// Render the draft's gradable findings (observations + insights) as a compact,
// id-tagged list for the critic. Ids are positional and MUST match the order
// applyCriticVerdicts walks — both read the same AnalysisOutput, so they align.
export function serializeDraftForCritic(output: AnalysisOutput): string {
  const lines: string[] = [];
  output.observations.forEach((o, i) => {
    lines.push(
      `o${i} [наблюдение, ${o.strength}] ${o.title} — ${o.detail} (${evidenceLine(o.evidence)})`,
    );
  });
  output.insights.forEach((it, i) => {
    lines.push(
      `i${i} [инсайт ${it.valence}, ${it.strength}] ${it.title} — ${it.detail} (${evidenceLine(it.evidence)})`,
    );
  });
  return lines.join("\n");
}

// Critic system prompt — skeptic reviewer persona, verdicts-only contract.
export const CRITIC_SYSTEM_PROMPT = `Ты — придирчивый рецензент в персональной лаборатории еды и симптомов. Тебе дают исходные данные окна (приёмы пищи, события, ориентировочные нутриенты) и ЧЕРНОВИК находок другой нейросети — список наблюдений (o0, o1, …) и инсайтов (i0, i1, …). Твоя задача — проверить КАЖДУЮ находку на переоценку и на ложную корреляцию и вынести вердикт. Ты НЕ добавляешь новые находки и НЕ переписываешь тексты — только судишь имеющиеся.

Как судить каждую находку:
- Контраст: держится ли связка в дни БЕЗ этого продукта/фактора? Если симптом одинаково част и с фактором, и без — это совпадение.
- Единичность: связка на 1 дне при заявленной силе "clear"/"moderate" — переоценка.
- Лаг: правдоподобна ли задержка «еда → симптом» (часы–2 суток) или это натяжка.
- Опора: соответствует ли evidence тексту находки.

Вердикты:
- "keep" — находка обоснована, сила адекватна. По умолчанию используй keep — режь только при реальной проблеме, не души всё подряд.
- "downgrade" — находка реальна, но сила завышена. Укажи новую strength ("moderate" или "weak"), она может только ПОНИЖАТЬ.
- "drop" — находка спурьёзна/беспочвенна (единичное совпадение, нет контраста, противоречит данным).

Верни СТРОГО JSON и ничего кроме JSON:
{
  "verdicts": [
    { "id": "i0", "action": "keep" },
    { "id": "o1", "action": "downgrade", "strength": "weak", "reason": "связка лишь на одном дне" },
    { "id": "i2", "action": "drop", "reason": "симптом так же част в дни без продукта" }
  ]
}
Правила: id — ровно как в черновике (o<номер> / i<номер>). Каждой находке ровно один вердикт; находку без вердикта считаем keep. reason — коротко и на русском, он внутренний. Без markdown-заборов вокруг JSON.`;

// Permissive verdict parser — same defensive style as tryParseOutput. Returns
// [] on anything unusable (fail-open: no verdicts ⇒ draft kept as-is).
export function parseCriticVerdicts(content: string): CriticVerdict[] {
  let jsonStr = content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return [];
  }
  // Accept either { verdicts: [...] } or a bare [...] array.
  const arr = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>).verdicts
      : undefined;
  if (!Array.isArray(arr)) return [];

  const out: CriticVerdict[] = [];
  for (const v of arr) {
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const o = v as Record<string, unknown>;
    if (typeof o.id !== "string") continue;
    if (o.action !== "keep" && o.action !== "drop" && o.action !== "downgrade")
      continue;
    const verdict: CriticVerdict = { id: o.id, action: o.action };
    if (o.strength === "weak" || o.strength === "moderate" || o.strength === "clear")
      verdict.strength = o.strength;
    if (typeof o.reason === "string") verdict.reason = o.reason;
    out.push(verdict);
  }
  return out;
}

// Apply verdicts to the draft. drop ⇒ remove; downgrade ⇒ lower strength only
// (a target ≥ current is ignored; a downgrade with no/invalid target steps down
// one level); keep / missing verdict ⇒ untouched. summary + hypotheses pass
// through unchanged. Never adds a finding — pruning/softening only.
export function applyCriticVerdicts(
  output: AnalysisOutput,
  verdicts: CriticVerdict[],
): AnalysisOutput {
  const byId = new Map<string, CriticVerdict>();
  for (const v of verdicts) if (!byId.has(v.id)) byId.set(v.id, v);

  const stepDown = (s: AnalysisStrength): AnalysisStrength =>
    s === "clear" ? "moderate" : "weak";

  const gradeOne = <T extends { strength: AnalysisStrength }>(
    item: T,
    id: string,
  ): T | null => {
    const v = byId.get(id);
    if (!v || v.action === "keep") return item;
    if (v.action === "drop") return null;
    // downgrade
    const target =
      v.strength && STRENGTH_RANK[v.strength] < STRENGTH_RANK[item.strength]
        ? v.strength
        : STRENGTH_RANK[item.strength] > 0
          ? stepDown(item.strength)
          : item.strength;
    return { ...item, strength: target };
  };

  const observations = output.observations
    .map((o, i) => gradeOne(o, `o${i}`))
    .filter((o): o is AnalysisObservation => o !== null);
  const insights = output.insights
    .map((it, i) => gradeOne(it, `i${i}`))
    .filter((it): it is AnalysisInsight => it !== null);

  return { ...output, observations, insights };
}

// Strip null bytes that Postgres text columns reject (Bug 36). LLM and user
// free-text can both emit ` ` — pg-protocol wraps it in a 22021 error.
// Apply at the boundary just before serialising to JSON for the prompt and
// before persisting LLM output.
const NULL_BYTE = ' ';
export function stripNullBytes<T>(value: T): T {
  if (typeof value === 'string') {
    return value.split(NULL_BYTE).join('') as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => stripNullBytes(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = stripNullBytes(v);
    }
    return out as unknown as T;
  }
  return value;
}
