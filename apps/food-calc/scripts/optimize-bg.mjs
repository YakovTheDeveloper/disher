import sharp from 'sharp';
import { readdir, rename, stat } from 'node:fs/promises';
import { join, parse } from 'node:path';

const BG_DIR = 'public/bg';

const sources = ['1.png', '2.jpg'];

async function renameJfifIfPresent() {
  const files = await readdir(BG_DIR);
  for (const f of files) {
    if (f.toLowerCase().endsWith('.jfif')) {
      const next = f.replace(/\.jfif$/i, '.jpg');
      await rename(join(BG_DIR, f), join(BG_DIR, next));
      console.log(`renamed ${f} -> ${next}`);
    }
  }
}

async function optimize(src) {
  const inPath = join(BG_DIR, src);
  const { name } = parse(src);
  const avifPath = join(BG_DIR, `${name}.avif`);
  const webpPath = join(BG_DIR, `${name}.webp`);

  await sharp(inPath).avif({ quality: 55, effort: 6 }).toFile(avifPath);
  await sharp(inPath).webp({ quality: 75, effort: 6 }).toFile(webpPath);

  const [orig, avif, webp] = await Promise.all([
    stat(inPath),
    stat(avifPath),
    stat(webpPath),
  ]);
  const kb = (b) => (b / 1024).toFixed(1) + ' KB';
  console.log(`${src}: orig ${kb(orig.size)} -> avif ${kb(avif.size)} / webp ${kb(webp.size)}`);
}

await renameJfifIfPresent();
for (const s of sources) await optimize(s);
