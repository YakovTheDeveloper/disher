import stylelint from 'stylelint';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { loadTokenMap, resolveToken } from './lib.mjs';
const COLOR_TEXT = { '--text-primary':'--sys-color-text-primary','--text-secondary':'--sys-color-text-secondary','--text-tertiary':'--sys-color-text-tertiary','--text-muted':'--sys-color-text-muted','--text-on-accent':'--sys-color-text-on-accent','--cta-brand-ink':'--sys-color-on-action-primary','--color-ink':'--sys-color-text-primary' };
const SURFACE = { '--surface-base':'--sys-color-surface-page','--surface-bright':'--sys-color-surface-bright' };
const RADIUS = { '--radius-full':'--sys-radius-indicator','--radius-sm':'--sys-radius-control','--radius-md':'--sys-radius-container','--radius-lg':'--sys-radius-cta','--radius-xl':'--sys-radius-drawer','--radius-2xl':'--sys-radius-sheet','--radius-xs':'--sys-radius-tmp' };
const DURATION = { '--press-in':'--sys-duration-press-in','--press-out':'--sys-duration-press-out','--duration-fast':'--sys-duration-fast','--duration-normal':'--sys-duration-normal','--duration-slow':'--sys-duration-slow','--duration-ios':'--sys-duration-ios' };
const EASING = { '--easing-default':'--sys-easing-default','--easing-spring':'--sys-easing-spring','--easing-ios':'--sys-easing-ios' };
const BG = { '--press-tint-bg':'--sys-color-bg-press' };
function curatedTarget(prop, legacy) {
  const p = prop.toLowerCase();
  if (/color$/.test(p) || p==='fill' || p==='stroke') return COLOR_TEXT[legacy];
  if (p==='border-radius') return RADIUS[legacy];
  if (/duration$/.test(p)) return DURATION[legacy];
  if (/timing-function$/.test(p)) return EASING[legacy];
  if (p==='background'||p==='background-color') return BG[legacy] ?? SURFACE[legacy] ?? COLOR_TEXT[legacy];
  return undefined;
}
const map = loadTokenMap();
const resolved = new Map();
for (const name of map.keys()) { try { resolved.set(name, resolveToken(name, map).trim().replace(/\s+/g,' ')); } catch {} }
const VARONLY = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/;
function classify(value, prop) {
  const m = value.match(VARONLY);
  const p = prop.toLowerCase();
  if (/font-size/.test(p)) return 'FONTSIZE';
  if (!m) return 'RAW';
  const legacy = m[1];
  if (legacy.startsWith('--sys-')) return 'already-sys';
  const sys = curatedTarget(prop, legacy);
  if (!sys) return 'KNOB/'+legacy;
  if (!resolved.has(sys)) return 'sys-missing/'+sys;
  if (resolved.get(legacy) !== resolved.get(sys)) return 'NEQ/'+legacy+'!='+sys;
  return 'A/'+sys;
}
process.env.STYLELINT_BASELINE_REGEN = '1';
const files = process.argv.slice(2).filter(a=>!a.startsWith('--'));
const { results } = await stylelint.lint({ files: files.length?files:'src/**/*.{scss,css}', configFile: path.resolve('.stylelintrc.cjs') });
const WARN_RE = /Expected keyword for "(.+)" of "(.+)" \(/;
let out=[];
const sorted = results.filter(r=>r.warnings.length&&r.source).map(r=>{
  const file = path.relative(process.cwd(), r.source).split(path.sep).join('/');
  const rows = r.warnings.map(w=>{ const mm=w.text.match(WARN_RE); const value=mm?mm[1]:w.text; const prop=mm?mm[2]:'?'; return {line:w.line,prop,value,b:classify(value,prop)}; });
  return {file,rows,n:rows.length};
}).sort((a,b)=>a.n-b.n);
for (const f of sorted) out.push(`### ${f.file} (${f.n})\n`+f.rows.map(x=>`  L${x.line} [${x.b}] ${x.prop}: ${x.value}`).join('\n'));
writeFileSync(process.argv.find(a=>a.startsWith('--out='))?.split('=')[1]||'census.txt', out.join('\n\n'));
console.log('files',sorted.length);
