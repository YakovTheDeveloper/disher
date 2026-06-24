#!/usr/bin/env node
// ─── crit.mjs — единственный источник чисел палитры warm-soft v2 ───────────────
// Восстановлен 2026-06-24 (goal-loop palette-consistency) после утери scratchpad.
// Содержит: hex/rgba-парсинг + альфа-композитинг, sRGB↔OKLCH (точные матрицы
// Björn Ottosson), APCA Lc (APCA-W3 0.1.9 / SA98G constants). НИКАКИХ чисел
// «на глаз» — всё через эти функции.
//
// Usage:
//   node scratchpad/crit.mjs report        # APCA текст×поверхность + лесенка hue/L/C
//   node scratchpad/crit.mjs oklch 0.62 0.012 85   # OKLCH→hex
//   node scratchpad/crit.mjs hex #89867e           # hex→OKLCH + Lc на поверхностях

// ── sRGB ↔ OKLCH ──────────────────────────────────────────────────────────────
const toLin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export function srgbToOklch([R, G, B]) {
  const r = toLin(R), g = toLin(G), b = toLin(B);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const Bb = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;
  const C = Math.hypot(A, Bb);
  let H = (Math.atan2(Bb, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

export function oklchToSrgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  return [r, g, bb].map((x) => Math.round(clamp01(toGamma(x)) * 255));
}

// ── colour parsing + alpha compositing ─────────────────────────────────────────
export function parse(str) {
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

// composite fg (may have alpha) over an opaque bg → opaque rgb
export function over(fg, bg) {
  const [fr, fg_, fb, fa] = parse(fg);
  const [br, bg_, bb] = parse(bg);
  return [
    fr * fa + br * (1 - fa),
    fg_ * fa + bg_ * (1 - fa),
    fb * fa + bb * (1 - fa),
  ];
}

export function toHex([r, g, b]) {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}

// ── APCA (APCA-W3 0.1.9 / 0.0.98G-4g) ──────────────────────────────────────────
function sRGBtoY([r, g, b]) {
  const lin = (c) => (c / 255) ** 2.4;
  return 0.2126729 * lin(r) + 0.7151522 * lin(g) + 0.0721750 * lin(b);
}

// Lc, signed: positive = dark text on light bg (BoW), negative = light on dark (WoB).
export function apcaLc(textRgb, bgRgb) {
  const blkThrs = 0.022, blkClmp = 1.414;
  let txtY = sRGBtoY(textRgb), bgY = sRGBtoY(bgRgb);
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

// Lc of a text colour over an (opaque) surface, both as CSS strings.
export function lcOn(textStr, surfaceStr, baseBehind = '#fefcf9') {
  const text = over(textStr, baseBehind); // text may itself be alpha (mute) — composite first
  const surf = parse(surfaceStr)[3] < 1 ? over(surfaceStr, baseBehind) : over(surfaceStr, surfaceStr);
  return apcaLc(text, surf);
}

// ── ground-truth surfaces & текст-роли (из palette.scss / mixin.scss) ───────────
export const SURFACES = {
  'surface-base #fefcf9': '#fefcf9',
  'white #ffffff': '#ffffff',
  'cards-page-bg #f5f3f0': '#f5f3f0',
  'raised (rgba 255,254,250,.7 over base)': 'rgba(255,254,250,0.7)',
  'raised over cards-page-bg': 'rgba(255,254,250,0.7)', // composited vs #f5f3f0 below
};

export const TEXT = {
  'primary #221f19': '#221f19',
  'secondary #757169': '#757169',
  'tertiary #817d76': '#817d76',
};

export const THRESHOLDS = { primary: 75, secondary: 60, tertiary: 60, ideal: 90 };

// neutral ladder (current values in tokens.scss) — для B2 проверки «hue 85»
export const NEUTRALS = {
  0: '#fefcf9', 50: '#faf9f6', 100: '#f5f3f0', 200: '#ebe9e5', 300: '#e2dfda',
  400: '#817d76', 500: '#757169', 600: '#5b5850', 700: '#46423b', 800: '#312d27',
  900: '#221f19', 1000: '#0d0b07',
};

function fmt(n, d = 1) { return n.toFixed(d); }

function report() {
  console.log('=== APCA Lc: текст × поверхность (|Lc|, порог в скобках) ===\n');
  const realSurfaces = {
    'surface-base #fefcf9': '#fefcf9',
    'white #ffffff': '#ffffff',
    'cards-page-bg #f5f3f0': '#f5f3f0',
  };
  // raised composited over both possible backdrops
  const raisedOverBase = toHex(over('rgba(255,254,250,0.7)', '#fefcf9'));
  const raisedOverCards = toHex(over('rgba(255,254,250,0.7)', '#f5f3f0'));
  realSurfaces[`raised/base ${raisedOverBase}`] = raisedOverBase;
  realSurfaces[`raised/cards ${raisedOverCards}`] = raisedOverCards;

  const roleThresh = { 'primary #221f19': 75, 'secondary #757169': 60, 'tertiary #817d76': 60 };
  for (const [tname, tcol] of Object.entries(TEXT)) {
    const thr = roleThresh[tname];
    let worst = Infinity;
    const cells = [];
    for (const [sname, scol] of Object.entries(realSurfaces)) {
      const lc = Math.abs(apcaLc(parse(tcol).slice(0, 3), parse(scol).slice(0, 3)));
      worst = Math.min(worst, lc);
      const ok = lc >= thr ? '✓' : '✗';
      cells.push(`${ok} ${fmt(lc)}  ${sname}`);
    }
    const pass = worst >= thr ? 'PASS' : 'FAIL';
    console.log(`${tname}  (порог ${thr}, ideal 90)  → worst |Lc| ${fmt(worst)}  [${pass}]`);
    for (const c of cells) console.log('    ' + c);
    console.log('');
  }

  console.log('=== Нейтраль-лесенка: фактические OKLCH (B2 «hue 85» проверка) ===\n');
  console.log('rung   hex        L      C       H(deg)   ΔL_prev');
  let prevL = null;
  const hues = [];
  for (const [rung, hex] of Object.entries(NEUTRALS)) {
    const { L, C, H } = srgbToOklch(parse(hex).slice(0, 3));
    hues.push(H);
    const dL = prevL === null ? '—' : fmt(Math.abs(L - prevL), 3);
    console.log(`${rung.padEnd(6)} ${hex}   ${fmt(L, 3)}  ${fmt(C, 4)}  ${fmt(H, 1).padStart(6)}   ${dL}`);
    prevL = L;
  }
  const hmin = Math.min(...hues), hmax = Math.max(...hues);
  console.log(`\nhue spread: ${fmt(hmin, 1)}° → ${fmt(hmax, 1)}°  (разброс ${fmt(hmax - hmin, 1)}°)`);
  console.log('→ «hue 85» — НЕ инвариант; лесенка purpose-stepped (см. ΔL обрывы).');
}

// Реальные поверхности (opaque) для гейта/тюнинга: raised композитится заранее.
export function realSurfaceList() {
  return {
    '#fefcf9': '#fefcf9',
    '#ffffff': '#ffffff',
    '#f5f3f0': '#f5f3f0',
    'raised/base': toHex(over('rgba(255,254,250,0.7)', '#fefcf9')),
    'raised/cards': toHex(over('rgba(255,254,250,0.7)', '#f5f3f0')),
  };
}

// worst |Lc| текста across all real surfaces
export function worstLc(textRgb) {
  return Math.min(...Object.values(realSurfaceList()).map((s) => Math.abs(apcaLc(textRgb, parse(s).slice(0, 3)))));
}

// найти САМЫЙ СВЕТЛЫЙ L (на hue/chroma) с worst-Lc ≥ target — tertiary остаётся «тусклым», но проходит
function tune(hue, chroma, target) {
  let best = null;
  for (let L = 0.70; L >= 0.30; L -= 0.001) {
    const rgb = oklchToSrgb(L, chroma, hue);
    if (worstLc(rgb) >= target) { best = { L, rgb }; break; }
  }
  if (!best) { console.log('no L found'); return; }
  const hex = toHex(best.rgb);
  console.log(`tune hue=${hue} C=${chroma} target=${target}: L=${fmt(best.L, 3)} → ${hex}`);
  for (const [sname, scol] of Object.entries(realSurfaceList())) {
    console.log(`    Lc ${sname.padEnd(12)} ${fmt(Math.abs(apcaLc(best.rgb, parse(scol).slice(0, 3))))}`);
  }
  const { L, C, H } = srgbToOklch(best.rgb);
  console.log(`    actual oklch(${fmt(L, 3)} ${fmt(C, 4)} ${fmt(H, 1)})`);
}

// ── Фаза 2 кандидаты (C1: тёплый navy + земельные статусы) ─────────────────────
// Все на тёплой бумаге #fefcf9. selected/fill = БЕЛЫЙ текст на заливке (reverse APCA);
// status-as-text = тёмный статус на бумаге (normal APCA).
function phase2() {
  const paper = '#fefcf9';
  const whiteOn = (hex) => Math.abs(apcaLc([255, 255, 255], over(hex, paper)));
  const onPaper = (hex) => Math.abs(apcaLc(over(hex, paper), parse(paper).slice(0, 3)));
  const line = (label, hex, kind) => {
    const lc = kind === 'fill' ? whiteOn(hex) : onPaper(hex);
    const { L, C, H } = srgbToOklch(over(hex, paper).map(Math.round));
    console.log(`  ${label.padEnd(28)} ${hex.padEnd(22)} oklch(${fmt(L, 3)} ${fmt(C, 4)} ${fmt(H, 1).padStart(6)})  ${kind === 'fill' ? 'white|Lc' : 'text|Lc'} ${fmt(lc)}`);
  };

  console.log('\n=== «ВЫБРАНО» fill (белый текст НА заливке; чем выше |Lc|, тем читаемее) ===');
  line('BEFORE navy', 'rgba(24,24,105,0.92)', 'fill');
  line('A warm-ink (n900)', '#221f19', 'fill');
  line('A2 warm-ink-soft (n800)', '#312d27', 'fill');
  line('B terracotta-deep', toHex(oklchToSrgb(0.44, 0.10, 40)), 'fill');
  line('C bronze/olive', toHex(oklchToSrgb(0.44, 0.06, 90)), 'fill');
  line('D coffee (warm-navy swap)', toHex(oklchToSrgb(0.40, 0.045, 60)), 'fill');

  console.log('\n=== СТАТУСЫ как текст/иконка НА тёплой бумаге #fefcf9 (порог ≥60, danger хочет ≥75) ===');
  line('danger BEFORE neon', 'rgb(236,0,0)', 'text');
  line('danger→terracotta (ref)', '#b25a3f', 'text');
  line('danger→terracotta-deep', toHex(oklchToSrgb(0.48, 0.13, 38)), 'text');
  line('success→moss (ref)', '#5f7a4c', 'text');
  line('success→sage-deep', toHex(oklchToSrgb(0.50, 0.08, 140)), 'text');
  line('warning BEFORE amber', 'rgb(184,110,26)', 'text');
  line('warning→amber-earth', toHex(oklchToSrgb(0.58, 0.10, 70)), 'text');

  console.log('\n=== ТЕНЬ-подтон (rgba над бумагой; альфа низкая → подтон едва виден) ===');
  console.log('  cool BEFORE   rgba(31,42,68)  = oklch ' + (() => { const { L, C, H } = srgbToOklch([31, 42, 68]); return `(${fmt(L, 3)} ${fmt(C, 4)} ${fmt(H, 1)})`; })());
  console.log('  warm cand     rgba(45,38,28)  = oklch ' + (() => { const { L, C, H } = srgbToOklch([45, 38, 28]); return `(${fmt(L, 3)} ${fmt(C, 4)} ${fmt(H, 1)})`; })() + '  (тёплый-уголь подтон)');
}

// ── CLI ─────────────────────────────────────────────────────────────────────
const [, , cmd, ...rest] = process.argv;
if (cmd === 'report' || !cmd) report();
else if (cmd === 'tune') tune(Number(rest[0] ?? 85), Number(rest[1] ?? 0.012), Number(rest[2] ?? 60));
else if (cmd === 'p2' || cmd === 'phase2') phase2();
else if (cmd === 'oklch') {
  const [L, C, H] = rest.map(Number);
  console.log(toHex(oklchToSrgb(L, C, H)), `oklch(${L} ${C} ${H})`);
} else if (cmd === 'hex') {
  const rgb = parse(rest[0]).slice(0, 3);
  const { L, C, H } = srgbToOklch(rgb);
  console.log(`${rest[0]}  →  oklch(${fmt(L, 3)} ${fmt(C, 4)} ${fmt(H, 1)})`);
  for (const [sname, scol] of Object.entries({ '#fefcf9': '#fefcf9', '#ffffff': '#ffffff', '#f5f3f0': '#f5f3f0' })) {
    console.log(`    Lc on ${sname}: ${fmt(Math.abs(apcaLc(rgb, parse(scol).slice(0, 3))))}`);
  }
}

// p2b: доп. кандидаты «выбрано» в направлении жёлтой brand-CTA + комплементарные
function p2b() {
  const paper = '#fefcf9';
  const whiteOn = (hex) => Math.abs(apcaLc([255,255,255], over(hex, paper)));
  const inkOn = (hex, ink) => Math.abs(apcaLc(parse(ink).slice(0,3), over(hex, paper)));
  const row = (label, hex, mode, ink) => {
    const lc = mode === 'darktext' ? inkOn(hex, ink) : whiteOn(hex);
    const { L, C, H } = srgbToOklch(over(hex, paper).map(Math.round));
    const txt = mode === 'darktext' ? `ink ${ink} |Lc` : 'white |Lc';
    console.log(`  ${label.padEnd(30)} ${hex.padEnd(10)} oklch(${fmt(L,3)} ${fmt(C,4)} ${fmt(H,1).padStart(6)})  ${txt} ${fmt(lc)}`);
  };
  console.log('\n=== жёлтая brand-CTA reference ===');
  console.log('  CTA fill #fff4bd→#fffae0, ink rgba(31,42,68,.92) — pale-yellow + navy-ink');
  console.log('\n=== «ВЫБРАНО» в направлении CTA (pale-yellow + ТЁМНЫЙ текст) ===');
  row('E pale-yellow + ink n900', '#fff4bd', 'darktext', '#221f19');
  row('E2 pale-yellow + navy-ink', '#fff4bd', 'darktext', 'rgb(31,42,68)');
  row('F gold-deep (white text)', toHex(oklchToSrgb(0.55,0.13,85)), 'white');
  row('F2 amber-deep (white text)', toHex(oklchToSrgb(0.50,0.12,75)), 'white');
  console.log('\n=== КОМПЛЕМЕНТАРНОЕ жёлтому (white text), гармония с тёплой бумагой ===');
  row('G petrol/teal-deep', toHex(oklchToSrgb(0.42,0.08,220)), 'white');
  row('H plum/aubergine-deep', toHex(oklchToSrgb(0.40,0.09,330)), 'white');
  row('I forest-deep', toHex(oklchToSrgb(0.42,0.08,150)), 'white');
}
if (process.argv[2] === 'p2b') p2b();

// p2c: cool-navy-ink (rgba 31,42,68 / 15,23,42 как ТЕКСТ) → тёплый-уголь кандидат.
// Тёплый эквивалент = n900-уголь rgba(34,31,25,α). APCA на бумаге #fefcf9 при
// репрезентативных альфах (текст высокий α / hairline низкий). Decision-prep, НЕ применять.
function p2c() {
  const paper = '#fefcf9';
  const lcAt = (rgb, a) => Math.abs(apcaLc(over(`rgba(${rgb},${a})`, paper), parse(paper).slice(0,3)));
  const COOL = '15, 23, 42', WARM = '34, 31, 25'; // slate-navy → тёплый-уголь n900-альфа
  console.log('=== cool-navy-ink ТЕКСТ → тёплый-уголь rgba(34,31,25,α) на #fefcf9 ===');
  console.log('  α      cool |Lc|   warm |Lc|   (тёплый-уголь = warm n900 alpha)');
  for (const a of [0.92, 0.84, 0.78, 0.62, 0.5, 0.45]) {
    console.log(`  ${a.toFixed(2)}    ${lcAt(COOL,a).toFixed(1).padStart(6)}      ${lcAt(WARM,a).toFixed(1).padStart(6)}`);
  }
  console.log('  → тёплый-уголь даёт сопоставимый/чуть выше Lc (теплее, не холодит); border/bg-альфы (<0.15) decorative.');
}
if (process.argv[2] === 'p2c') p2c();
