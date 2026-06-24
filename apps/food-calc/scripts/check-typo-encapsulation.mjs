#!/usr/bin/env node
// ─── typo-encapsulation gate (typography-token-encapsulation-2026-06-24) ───────
// Инвариант: ГОЛОС роли (типо-семантика) живёт ТОЛЬКО в React-примитивах
// `<Heading>`/`<Text>`/`<QuietLabel>` (+ их `text-role()` миксин и корневые
// публикации). Компоненты НЕ читают типо-семантические токены через `var()` и НЕ
// пишут сырые `font-*`-объявления — иначе голос рассыпается по модулям, ровно тот
// дрейф, который инкапсуляция убирает (project_design_dna 2026-06-21).
//
// Закрывает дыру, которую strict-value/check-text-role/check-scale НЕ ловят:
//   • strict-value требует var() у `font-size`, но не различает РАЗРЕШЁННЫЙ var
//     от запрещённого, и не гейтит `font-weight`/`font-family`/`letter-spacing`.
//   • check-text-role гейтит только `@include text-role(`, не прямое `var()`.
//
// Две проверки в одном проходе (вне allow-list):
//   CHECK A — TYPO-RESTRICTED var()-чтение:
//     var(--sys-text-…) | var(--heading-…) | var(--font-sans)
//     (SCSS-интерполяция `var(--sys-text-#{$role}-…)` пропускается — имя собирается
//      в compile-time, как в check-scale-tokens.)
//     NB: `--font-display/-alice/-mono/-big-numeric` — family-ПРИМИТИВЫ (ресурс
//     не-ролевого текста), НЕ restricted; рестриктится только точный `--font-sans`.
//   CHECK B — RAW-TYPO объявление:
//     ^(font-size|font-weight|font-family|letter-spacing): со значением-ЛИТЕРАЛОМ
//     (не var()/inherit/initial/unset/revert/$scss). `font-style:italic` — фолловап,
//     не в v1 (чтобы не ловить нативные курсивы).
//
// Ratchet (как stylelint-baseline): текущие нарушители амнистируются пофайлово в
// typo-encapsulation-baseline.cjs. Новый/нетронутый файл обязан быть чист; файл
// выходит из baseline по миграции (удалить из списка вручную). Регенерация:
//   TYPO_BASELINE_REGEN=1 node scripts/check-typo-encapsulation.mjs
//   (или `npm run check:typo:baseline`)
//
// Usage:
//   node scripts/check-typo-encapsulation.mjs            # скан всех src/**/*.{scss,css}
//   node scripts/check-typo-encapsulation.mjs a.scss …   # только эти (hook/lint-staged)
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..');
const SRC = join(APP, 'src');
const BASELINE_PATH = join(APP, 'typo-encapsulation-baseline.cjs');

// Санкционированные дома типо-голоса. Каждый — суффикс пути (forward-slash).
// Расширять ТОЛЬКО с обоснованием в комментарии — это PR-видимое осознанное окно.
const ALLOW = [
  'shared/ui/atoms/Typography/Heading/Heading.module.scss', //    примитив <Heading role>
  'shared/ui/atoms/Typography/Text/Text.module.scss', //          примитив <Text role>
  'shared/ui/atoms/Typography/QuietLabel/QuietLabel.module.scss', // примитив <QuietLabel> (serif-italic тихий указатель)
  'shared/ui/atoms/Typography/FieldLabel/FieldLabel.module.scss', // метка поля (раскладка над <Text role="label">)
  'shared/assets/style/mixin.scss', //   text-role() + field-mixin (корневая публикация)
  'shared/assets/style/index.scss', //   body{} корневой
  'shared/assets/style/tokens.scss', //  ОПРЕДЕЛЕНИЯ типо-токенов
];

// CHECK A — запрещённое var()-чтение типо-семантики.
const RESTRICTED_VAR_RE = /var\(\s*(--sys-text-[A-Za-z0-9-]+|--heading-[A-Za-z0-9-]+|--font-sans)\b/g;

// CHECK B — сырое типо-объявление. Свойство + значение до `;`/конца строки.
const RAW_DECL_RE = /^\s*(font-size|font-weight|font-family|letter-spacing)\s*:\s*([^;]+)/i;
// Значение считается «токенизированным» (НЕ нарушение), если оно — var()/ключевое
// слово/SCSS-переменная/интерполяция. Иначе литерал (px/rem/em/число/строка).
const VALUE_OK_RE = /^(var\(|inherit|initial|unset|revert|\$|#\{)/;

function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');
}

function walk(dir, acc) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (p.endsWith('.scss') || p.endsWith('.css')) acc.push(p);
  }
}

function isAllowed(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  return ALLOW.some((a) => norm.endsWith(a));
}

function loadBaseline() {
  try {
    // .cjs со `module.exports = [...]` — читаем как текст и парсим JSON-массив.
    const txt = readFileSync(BASELINE_PATH, 'utf8');
    const m = txt.match(/module\.exports\s*=\s*(\[[\s\S]*?\]);?/);
    return new Set(m ? JSON.parse(m[1]) : []);
  } catch {
    return new Set();
  }
}

// Собрать нарушения одного файла (без учёта baseline).
function violationsIn(relPath, text) {
  const out = [];
  const stripped = stripComments(text);
  stripped.split(/\r?\n/).forEach((line, i) => {
    // CHECK A
    for (const m of line.matchAll(RESTRICTED_VAR_RE)) {
      // Интерполяция `var(--sys-text-#{...}` — имя не статично, не реф.
      if (line[m.index + m[0].length] === '#') continue;
      out.push({ file: relPath, line: i + 1, kind: 'A', code: m[0] });
    }
    // CHECK B
    const d = line.match(RAW_DECL_RE);
    if (d) {
      const val = d[2].trim();
      if (!VALUE_OK_RE.test(val)) {
        out.push({ file: relPath, line: i + 1, kind: 'B', code: `${d[1]}: ${val}` });
      }
    }
  });
  return out;
}

const allFiles = [];
walk(SRC, allFiles);

// ─── Регенерация baseline ─────────────────────────────────────────────────────
if (process.env.TYPO_BASELINE_REGEN) {
  const failing = new Set();
  for (const f of allFiles) {
    const rel = relative(APP, f);
    if (isAllowed(rel)) continue;
    if (violationsIn(rel, readFileSync(f, 'utf8')).length) {
      failing.add(rel.replace(/\\/g, '/'));
    }
  }
  const banner =
    '// AUTO-GENERATED by scripts/check-typo-encapsulation.mjs — do not edit by hand.\n' +
    '// Файлы, амнистированные от typo-encapsulation gate (ratchet baseline).\n' +
    '// Файл выходит из списка по миграции в примитив. Регенерация:\n' +
    '//   TYPO_BASELINE_REGEN=1 node scripts/check-typo-encapsulation.mjs\n\n';
  writeFileSync(
    BASELINE_PATH,
    banner + 'module.exports = ' + JSON.stringify([...failing].sort(), null, 2) + ';\n',
  );
  console.log(`typo-encapsulation baseline: ${failing.size} legacy files amnestied`);
  process.exit(0);
}

// ─── Обычная проверка ─────────────────────────────────────────────────────────
const baseline = loadBaseline();
const targets = process.argv.slice(2).filter((a) => a.endsWith('.scss') || a.endsWith('.css'));
const filesToCheck = targets.length ? targets : allFiles;

const violations = [];
for (const f of filesToCheck) {
  const rel = relative(APP, f);
  if (isAllowed(rel)) continue;
  if (baseline.has(rel.replace(/\\/g, '/'))) continue; // амнистирован — ждёт миграции
  let text;
  try {
    text = readFileSync(f, 'utf8');
  } catch {
    continue; // удалён между стейджем и проверкой — пропуск
  }
  violations.push(...violationsIn(rel, text));
}

if (violations.length) {
  const a = violations.filter((v) => v.kind === 'A').length;
  const b = violations.filter((v) => v.kind === 'B').length;
  console.error(
    `\n✖ typo-encapsulation: ${violations.length} нарушение(й) (A:${a} запрещённый var, B:${b} сырое объявление):\n`,
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.kind}]  ${v.code}`);
  }
  console.error('\nТипо-голос инкапсулируется в примитивах <Heading>/<Text>/<QuietLabel>.');
  console.error('A: используй примитив вместо прямого var(--sys-text-/--heading-/--font-sans).');
  console.error('B: вынеси font-* в роль примитива (text-role), не объявляй литералом здесь.');
  console.error('Санкционировать новый дом — добавь путь в ALLOW в scripts/check-typo-encapsulation.mjs.');
  process.exit(1);
}

console.log(
  `✓ typo-encapsulation: ${filesToCheck.length} file(s) checked, ${baseline.size} baselined, типо-голос внутри примитивов`,
);
