const sharp = require('C:/Users/booty/Documents/GitHub/disher/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const fs = require('fs');
const dir = 'apps/food-calc/src/shared/assets/icons/food-variants';
(async () => {
  for (const f of process.argv[2].split(',')) {
    const buf = await sharp(fs.readFileSync(`${dir}/${f}.svg`), { density: 384 })
      .resize(768, 768).png().toBuffer();
    const base = Buffer.from(`<svg width="820" height="820"><rect width="100%" height="100%" rx="50%" fill="#2b2f36"/></svg>`);
    await sharp(base).composite([{ input: buf, left: 26, top: 26 }]).png().toFile(`scratchpad/one-${f}.png`);
  }
})();
