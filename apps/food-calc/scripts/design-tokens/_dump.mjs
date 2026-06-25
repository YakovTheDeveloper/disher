import stylelint from 'stylelint';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
process.env.STYLELINT_BASELINE_REGEN = '1';
const { results } = await stylelint.lint({ files: 'src/**/*.{scss,css}', configFile: path.resolve('.stylelintrc.cjs') });
const RE = /Expected keyword for "(.+)" of "(.+)" \(/;
const KNOB = /var\(\s*--(wb|ic|hc|fl|nt|inline|group-accent|back-fg|spin-head|hero-logo|press-fg-invert|icon-btn|d-ink|d-fs|ap-fs|hint|medal-plate|screen-surface)/;
let out = [];
const sorted = results.filter(r => r.warnings.length && r.source).map(r => {
  const file = path.relative(process.cwd(), r.source).split(path.sep).join('/');
  const rows = r.warnings.map(w => { const m = w.text.match(RE); return m ? `L${w.line} ${m[2]}: ${m[1]}` : null; }).filter(Boolean);
  const knob = rows.some(x => KNOB.test(x));
  return { file, rows, knob, n: rows.length };
}).sort((a,b) => a.n - b.n);
for (const f of sorted) out.push(`### ${f.knob?'[KNOB]':'[color]'} ${f.file} (${f.n})\n` + f.rows.map(x=>'  '+x).join('\n'));
writeFileSync(process.argv[2] || 'dump.txt', out.join('\n'));
console.log(`files: ${sorted.length}, color-only: ${sorted.filter(f=>!f.knob).length}, knob: ${sorted.filter(f=>f.knob).length}`);
