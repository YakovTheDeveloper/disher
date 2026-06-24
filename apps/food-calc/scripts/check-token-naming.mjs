#!/usr/bin/env node
// ─── naming-gate (T1, 2026-06-24) ─────────────────────────────────────────────
// Ratchet против НОВЫХ bespoke-токенов в палитре. Любая custom-property,
// ОПРЕДЕЛЁННАЯ в tokens.scss / palette.scss, обязана начинаться с канонического
// яруса `--sys-*` / `--ref-*` (CTI 2-ярус, tds/token-canon-rename), ЛИБО попадать
// в документированный allow-list исключений:
//   • RAW    — `--color-*` сырые примитивы палитры (палитра-первоисточник).
//   • DOMAIN — `--nutrient-* / --event-* / --tod-*` data-carrying пастели
//     (намеренно вне sys/ref — несут доменный смысл, не нейтраль).
//   • LEGACY — семейства, ждущие rename-codemod legacy→ref/sys (§1d плана). Это
//     амнистия СУЩЕСТВУЮЩИХ; добавлять сюда НОВЫЕ нельзя — для нового токена
//     заведи его сразу как `--sys-*`/`--ref-*`.
//
// Назначение — поймать дрейф: новый `--my-widget-bg:` в tokens.scss провалит гейт,
// заставив выбрать sys/ref-имя по смыслу, а не плодить россыпь. Зелёный сегодня.
//
// Scope: ТОЛЬКО tokens.scss + palette.scss (определения палитры). mixin.scss и
// компонентные .scss публикуют runtime/scope-токены — вне этого гейта.
//
// Usage:
//   node scripts/check-token-naming.mjs                 # дефолт: оба файла палитры
//   node scripts/check-token-naming.mjs a.scss b.scss   # только эти (hook/lint-staged)
import { readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const APP = join(here, '..');
const STYLE = join(APP, 'src/shared/assets/style');
const DEFAULT_FILES = [join(STYLE, 'tokens.scss'), join(STYLE, 'palette.scss')];

const CANON = ['--sys-', '--ref-']; // 2-ярус канон
const RAW = ['--color-']; // сырые примитивы палитры
const DOMAIN = ['--nutrient-', '--event-', '--tod-']; // доменные пастели
// LEGACY — амнистия существующих семейств до rename-codemod (§1d). НОВЫЕ сюда НЕ добавлять.
const LEGACY = [
  '--border-', '--bottom-action-', '--cta-', '--duration-', '--easing-', '--font-',
  '--heading-', '--modal-title-', '--plate-', '--press-', '--radius-', '--row-',
  '--shadow-', '--space-', '--surface-', '--text-',
];
const ALLOWED = [...CANON, ...RAW, ...DOMAIN, ...LEGACY];

// blank out comments so a `--token:` mentioned in a comment isn't read as a def
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '');
}

// A definition = `--name:` where the `--` opens a declaration (start of line /
// after `{` or `;`). Excludes `var(--x, …)` fallbacks (no colon follows there).
const DEF_RE = /(^|[{;])\s*(--[a-z0-9-]+)\s*:/gim;

const targets = process.argv.slice(2).filter((a) => a.endsWith('.scss'));
const files = targets.length ? targets : DEFAULT_FILES;

const violations = [];
for (const f of files) {
  let text;
  try {
    text = readFileSync(f, 'utf8');
  } catch {
    continue;
  }
  const lines = stripComments(text).split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(DEF_RE)) {
      const name = m[2];
      if (!ALLOWED.some((p) => name.startsWith(p))) {
        violations.push({ file: relative(APP, f), line: i + 1, name });
      }
    }
  });
}

if (violations.length) {
  console.error(`\n✖ naming-gate: ${violations.length} токен(ов) вне канона sys/ref + allow-list:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.name}`);
  }
  console.error('\nНовый токен палитры обязан быть --sys-*/--ref-* (по СМЫСЛУ, CTI 2-ярус).');
  console.error('Исключения (домен-пастели / --color-* raw / legacy-до-rename) — в check-token-naming.mjs.');
  process.exit(1);
}

console.log(`✓ naming-gate: ${files.length} file(s), все токены палитры в каноне sys/ref + документированный allow-list`);
