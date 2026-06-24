#!/usr/bin/env node
// ─── APCA-gate (T2, 2026-06-24) ───────────────────────────────────────────────
// Гейт легибельности нейтрали: каждая текст-роль обязана давать APCA Lc ≥ порога
// на КАЖДОЙ реальной поверхности приложения. Ловит регресс, который critique
// warm-soft v2 нашёл вручную: --text-tertiary читался Lc 57 (<60) на #f5f3f0,
// хотя на бумаге #fefcf9 проходил (62) — «проверили на одном фоне» = дыра.
//
// Значения текст-ролей ЧИТАЮТСЯ из palette.scss (не хардкод) — поправил токен,
// гейт пересчитал. Поверхности — реальные фоны под текстом (surface-base, white/
// card, cards-page-bg + полупрозрачный raised, скомпонованный над обоими).
// Пороги (tds/token-canon-rename §4.0): primary ≥75, secondary ≥60, tertiary ≥60
// (ideal 90). Алгоритм — APCA-W3 0.1.9, идентичен scratchpad/crit.mjs (источник
// чисел); этот файл — самодостаточная пайплайн-копия (не зависит от scratchpad).
//
// Usage: node scripts/check-apca-contrast.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const STYLE = join(here, '..', 'src/shared/assets/style');

// ── APCA-W3 0.1.9 (SA98G) ──────────────────────────────────────────────────────
function sRGBtoY([r, g, b]) {
  const lin = (c) => (c / 255) ** 2.4;
  return 0.2126729 * lin(r) + 0.7151522 * lin(g) + 0.0721750 * lin(b);
}
function apcaLc(text, bg) {
  const blkThrs = 0.022, blkClmp = 1.414;
  let txtY = sRGBtoY(text), bgY = sRGBtoY(bg);
  if (txtY <= blkThrs) txtY += (blkThrs - txtY) ** blkClmp;
  if (bgY <= blkThrs) bgY += (blkThrs - bgY) ** blkClmp;
  if (Math.abs(bgY - txtY) < 0.0005) return 0;
  let out;
  if (bgY > txtY) {
    const sapc = (bgY ** 0.56 - txtY ** 0.57) * 1.14;
    out = sapc < 0.1 ? 0 : sapc - 0.027;
  } else {
    const sapc = (bgY ** 0.65 - txtY ** 0.62) * 1.14;
    out = sapc > -0.1 ? 0 : sapc + 0.027;
  }
  return out * 100;
}

// ── colour parse + alpha compositing ───────────────────────────────────────────
function parse(str) {
  str = str.trim();
  const hx = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hx) {
    let h = hx[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const rgba = str.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const p = rgba[1].split(',').map((s) => parseFloat(s.trim()));
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  throw new Error(`cannot parse colour: ${str}`);
}
function over(fg, bg) {
  const [fr, fgc, fb, fa] = parse(fg);
  const [br, bgc, bb] = parse(bg);
  return [fr * fa + br * (1 - fa), fgc * fa + bgc * (1 - fa), fb * fa + bb * (1 - fa)];
}

// ── read live token values from the palette files ──────────────────────────────
function tokenValue(file, name) {
  const text = readFileSync(join(STYLE, file), 'utf8');
  const m = text.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  if (!m) throw new Error(`token ${name} not found in ${file}`);
  return m[1].split('//')[0].trim();
}

const TEXT = {
  'text-primary': { value: tokenValue('palette.scss', '--text-primary'), min: 75 },
  'text-secondary': { value: tokenValue('palette.scss', '--text-secondary'), min: 60 },
  'text-tertiary': { value: tokenValue('palette.scss', '--text-tertiary'), min: 60 },
};

const surfaceBase = tokenValue('palette.scss', '--surface-base'); // #fefcf9
const surfaceRaised = tokenValue('palette.scss', '--surface-raised'); // rgba(...)
const cardsPageBg = tokenValue('mixin.scss', '--cards-page-bg'); // #f5f3f0

// Реальные непрозрачные фоны под текстом (raised композитим над обоими backdrop'ами).
const SURFACES = {
  'surface-base': parse(surfaceBase).slice(0, 3),
  'white/card': [255, 255, 255],
  'cards-page-bg': parse(cardsPageBg).slice(0, 3),
  'raised/base': over(surfaceRaised, surfaceBase),
  'raised/cards': over(surfaceRaised, cardsPageBg),
};

const IDEAL = 90;
const fails = [];
const rows = [];
for (const [role, { value, min }] of Object.entries(TEXT)) {
  const txt = parse(value).slice(0, 3);
  let worst = Infinity;
  let worstSurf = '';
  for (const [sname, srgb] of Object.entries(SURFACES)) {
    const lc = Math.abs(apcaLc(txt, srgb));
    if (lc < worst) { worst = lc; worstSurf = sname; }
    if (lc < min) fails.push({ role, value, sname, lc, min });
  }
  const flag = worst >= IDEAL ? '★' : worst >= min ? '✓' : '✗';
  rows.push(`  ${flag} ${role.padEnd(15)} ${value.padEnd(9)} worst |Lc| ${worst.toFixed(1)} on ${worstSurf} (порог ${min}, ideal ${IDEAL})`);
}

console.log('APCA-gate: текст-роли × реальные поверхности');
for (const r of rows) console.log(r);

if (fails.length) {
  console.error(`\n✖ APCA-gate: ${fails.length} провал(ов) ниже порога:\n`);
  for (const f of fails) {
    console.error(`  ${f.role} (${f.value}) на ${f.sname}: |Lc| ${f.lc.toFixed(1)} < ${f.min}`);
  }
  console.error('\nПодбери значение через scratchpad/crit.mjs (node scratchpad/crit.mjs tune <hue> <chroma> <target>).');
  process.exit(1);
}
console.log('\n✓ APCA-gate: все текст-роли проходят порог на всех реальных поверхностях');
