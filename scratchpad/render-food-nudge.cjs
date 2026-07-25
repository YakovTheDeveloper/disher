// Проверка nudge: монета с дугой «Список еды» сверху + гравюра со сдвигом вниз 5%.
const sharp = require('C:/Users/booty/Documents/GitHub/disher/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const dir = 'apps/food-calc/src/shared/assets/icons/food-variants';
const files = ['fv-cornucopia', 'fv-feast-iso', 'fv-clipboard'];
const S = 240;

async function coin(file, nudge) {
  const icon = Math.round(S * 0.82);
  const iconBuf = await sharp(fs.readFileSync(path.join(dir, file + '.svg')), { density: 384 })
    .resize(icon, icon).png().toBuffer();
  const off = Math.round((S - icon) / 2 + S * nudge);
  const base = Buffer.from(`<svg width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="50%" fill="#2b2f36"/>
    <defs><path id="arc" d="M ${S * 0.18} ${S * 0.5} A ${S * 0.32} ${S * 0.32} 0 0 1 ${S * 0.82} ${S * 0.5}"/></defs>
    <text font-family="sans-serif" font-size="${S * 0.075}" fill="#fff" letter-spacing="1">
      <textPath href="#arc" startOffset="50%" text-anchor="middle">Список еды</textPath>
    </text>
  </svg>`);
  return sharp(base).composite([{ input: iconBuf, left: Math.round((S - icon) / 2), top: off }]).png().toBuffer();
}

(async () => {
  const gap = 12;
  const W = files.length * 2 * S + (files.length * 2 + 1) * gap;
  const parts = [];
  for (let i = 0; i < files.length; i++) {
    parts.push({ input: await coin(files[i], 0), left: gap + i * 2 * (S + gap), top: gap });
    parts.push({ input: await coin(files[i], 0.05), left: gap + (i * 2 + 1) * (S + gap), top: gap });
  }
  await sharp({ create: { width: W, height: S + 2 * gap, channels: 3, background: '#999' } })
    .composite(parts).png().toFile('scratchpad/food-nudge-check.png');
  console.log('ok (пары: слева без nudge, справа +5%)');
})();
