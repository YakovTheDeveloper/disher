// Рендер листа-превью гравюр медали «Новое событие»: тёмная монета.
// Дуговая отсечка зашита в mask самих SVG — симулировать не нужно.
const sharp = require('C:/Users/booty/Documents/GitHub/disher/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const dir = 'apps/food-calc/src/shared/assets/icons/event-variants';
const files = [
  'ev-tent', 'ev-sunrise', 'ev-stall', 'ev-moon', 'ev-belltower', 'ev-bell',
  'ev-lighthouse-a', 'ev-lighthouse-b', 'ev-lighthouse-c',
  'ev-boat', 'ev-boat-b', 'ev-boat-iso', 'ev-mind-book', 'ev-mind-window',
  'ev-comet', 'ev-comet-b', 'ev-comet-c',
  'ev-stargaze', 'ev-shooting', 'ev-observatory', 'ev-firework',
];
const BG = '#2b2f36';

async function coin(file, S) {
  const icon = Math.round(S * 0.82);
  const iconBuf = await sharp(fs.readFileSync(path.join(dir, file + '.svg')), { density: 384 })
    .resize(icon, icon).png().toBuffer();
  const base = Buffer.from(
    `<svg width="${S}" height="${S}"><rect width="100%" height="100%" rx="50%" fill="${BG}"/></svg>`,
  );
  const off = Math.round((S - icon) / 2);
  return sharp(base).composite([{ input: iconBuf, left: off, top: off }]).png().toBuffer();
}

(async () => {
  const gap = 12;
  const cols = 7;
  const rowsS = [144, 72];
  const W = cols * 144 + (cols + 1) * gap;
  const lines = Math.ceil(files.length / cols);
  const H = rowsS.reduce((a, s) => a + s * lines + gap * lines, 0) + gap;
  const parts = [];
  let y = gap;
  for (const S of rowsS) {
    for (let i = 0; i < files.length; i++) {
      const x = gap + (i % cols) * (144 + gap);
      const yy = y + Math.floor(i / cols) * (S + gap);
      parts.push({ input: await coin(files[i], S), left: x, top: yy });
    }
    y += lines * (S + gap);
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: '#999999' } })
    .composite(parts)
    .png()
    .toFile('scratchpad/event-icons-v12.png');
  console.log('ok', W, H);
})();
