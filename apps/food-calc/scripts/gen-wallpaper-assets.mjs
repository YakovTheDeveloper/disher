// Генератор ассетов обоев: art-src/hero/<оригинал> → public/art/hero/{<id>.webp, thumb/<id>.webp}.
//
// ЗАЧЕМ. Пикер обоев рендерил миниатюру 96×64, а в src клал полноразмерный JPG на
// 300–650 KB — 18 штук, ~7 MB на открытие «Внешнего вида». Отдельных thumbnail'ов
// не существовало вовсе.
//
// ЗАЧЕМ art-src. Оригиналы лежат ВНЕ public/, иначе Vite копирует их в dist и все
// 7 MB уезжают на прод рядом со сжатыми webp. public/ = только то, что отдаётся.
//
// ИМЕНА ПО id. Файл называется по слагу из wallpaper-catalog (`grapes.webp`), а не
// по музейному инвентарному номеру. Каталогу больше не нужно хранить пути — они
// выводятся из id. Побочно уходят три кириллических имени (`события-1.jpg`), которые
// зависели бы от URL-энкодинга на чужом nginx.
//
// Запуск: node scripts/gen-wallpaper-assets.mjs (из apps/food-calc).

import { mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const SRC_DIR = 'art-src/hero';
const OUT_DIR = 'public/art/hero';
const THUMB_DIR = join(OUT_DIR, 'thumb');

// id (слаг из wallpaper-catalog.ts — ПИШЕТСЯ В localStorage, не менять) → файл-оригинал.
const SOURCES = {
  grapes: 'SAAM-1977.99.2_2_screen.jpg',
  lemur: 'NZP-20181114-3807SB_screen.jpg',
  'autumn-forest': 'CHSDM-23644_02-000001_screen.jpg',
  'high-tide': 'SAAM-1996.63.168_1_screen.jpg',
  hammock: 'SAAM-1996.63.170_1_screen.jpg',
  palms: 'hero-events.jpg',
  flute: 'CHSDM-259998D64EE22-000001_screen.jpg',
  sampler: 'hero-events-2.jpg',
  gallery: 'NPG-AD_NPG_83_2BradysPhotoGallery-000001_screen.jpg',
  antelopes: 'CHSDM-D24E5D6646192-000001_screen.jpg',
  fortress: 'hero-art-1.png',
  // hero-auth.jpg — байт-в-байт дубль этого файла; экран входа теперь берёт square.webp.
  square: 'CHSDM-B9FC4D1302062-000001_screen.jpg',
  painter: 'NPG-NPG_93_5Russell-000001_screen.jpg',
  'village-moon': 'CHSDM-6FE1E03EBF6F2-000001_screen.jpg',
  'chinese-gallery': 'CHSDM-CHP6573_screen.jpg',
  salon: 'события-1.jpg',
  pudding: 'события-2.jpg',
  deer: 'события-3.jpg',
};

// Hero — full-bleed обложка. 1400px хватает на 430 CSS-px × 3 DPR с запасом.
const FULL = { width: 1400, quality: 78 };
// Миниатюра рендерится 96×64 → 2× DPR.
const THUMB = { width: 192, height: 128, quality: 80 };

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

await mkdir(THUMB_DIR, { recursive: true });

const present = new Set(await readdir(SRC_DIR));
const missing = Object.values(SOURCES).filter((f) => !present.has(f));
if (missing.length) {
  console.error(`✗ нет оригиналов в ${SRC_DIR}:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

let srcTotal = 0;
let outTotal = 0;

for (const [id, file] of Object.entries(SOURCES)) {
  const src = join(SRC_DIR, file);
  const image = sharp(src);
  const { size: srcSize } = await stat(src);

  const full = await image
    .clone()
    .resize({ width: FULL.width, withoutEnlargement: true })
    .webp({ quality: FULL.quality })
    .toFile(join(OUT_DIR, `${id}.webp`));

  const thumb = await image
    .clone()
    .resize({ width: THUMB.width, height: THUMB.height, fit: 'cover' })
    .webp({ quality: THUMB.quality })
    .toFile(join(THUMB_DIR, `${id}.webp`));

  srcTotal += srcSize;
  outTotal += full.size + thumb.size;
  console.log(
    `${id.padEnd(16)} ${kb(srcSize).padStart(7)} → ${kb(full.size).padStart(6)} + ${kb(thumb.size)}`,
  );
}

console.log(`\n✓ ${Object.keys(SOURCES).length} обоев: ${kb(srcTotal)} → ${kb(outTotal)}`);
