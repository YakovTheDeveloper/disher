#!/usr/bin/env node
// One-shot codemod (2026-06-24, по sign-off юзера): тёплый подтон ТЕНЕЙ.
// cool navy/slate (rgba(31,42,68,*) / rgba(15,23,42,*)) → warm уголь rgba(45,38,28,*)
// ТОЛЬКО внутри shadow-деклараций (box-shadow / --*shadow* / drop-shadow). Текст/
// border/background с тем же триплетом НЕ трогаем (это отдельный cool-navy-ink
// finding — см. plan). Альфа сохраняется. Исключения: dev s_*/, файлы параллельной
// сессии (WriteBarShell, AtomBuilder), сам codemod.
//
// Usage: node scratchpad/warm-shadow-codemod.mjs --dry   |   --apply
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'apps/food-calc/src';
const EXCLUDE = [
  'development-features/s_', // dev предложки (gitignored)
  'WriteBarShell.module.scss', // параллельная сессия — uncommitted
  'AtomBuilder.module', // параллельная сессия
];
const apply = process.argv.includes('--apply');

// declaration: `prop: value;` (value многострочный, без ; { }) where prop OR value mentions shadow
const DECL_RE = /([\w-]+)\s*:\s*([^;{}]*?)\s*;/g;
const COOL_RE = /rgba\(\s*(?:31\s*,\s*42\s*,\s*68|15\s*,\s*23\s*,\s*42)\s*,\s*([0-9.]+)\s*\)/g;

function walk(dir, acc) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith('.scss') || p.endsWith('.css')) acc.push(p);
  }
}

const files = [];
walk(SRC, files);
let totalDecls = 0, totalRepl = 0;
const report = [];

for (const f of files) {
  const norm = f.replace(/\\/g, '/');
  if (EXCLUDE.some((x) => norm.includes(x))) continue;
  const text = readFileSync(f, 'utf8');
  let fileRepl = 0, fileDecls = 0;
  const out = text.replace(DECL_RE, (decl, prop, value) => {
    const isShadow = /shadow/i.test(prop) || /shadow/i.test(value);
    if (!isShadow) return decl;
    let n = 0;
    const newVal = value.replace(COOL_RE, (_m, a) => { n++; return `rgba(45, 38, 28, ${a})`; });
    if (n) { fileDecls++; fileRepl += n; }
    return decl.replace(value, newVal);
  });
  if (fileRepl) {
    totalDecls += fileDecls; totalRepl += fileRepl;
    report.push(`  ${norm}  — ${fileRepl} triplet(s) in ${fileDecls} shadow-decl(s)`);
    if (apply) writeFileSync(f, out);
  }
}

console.log(`${apply ? 'APPLIED' : 'DRY-RUN'}: ${totalRepl} cool→warm shadow-triplet(s) across ${report.length} file(s), ${totalDecls} shadow-declaration(s)\n`);
console.log(report.join('\n'));
