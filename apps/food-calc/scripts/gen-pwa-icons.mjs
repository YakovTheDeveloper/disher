import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '../public');
const SRC = path.join(PUBLIC, 'logo', 'square-logo.png');

const meta = await sharp(SRC).metadata();
if (meta.width !== meta.height) {
  console.warn(`[gen-pwa-icons] source is ${meta.width}x${meta.height}, expected square`);
}

await sharp(SRC).resize(192, 192, { fit: 'cover' }).png({ compressionLevel: 9 })
  .toFile(path.join(PUBLIC, 'icon-192.png'));

await sharp(SRC).resize(512, 512, { fit: 'cover' }).png({ compressionLevel: 9 })
  .toFile(path.join(PUBLIC, 'icon-512.png'));

await sharp(SRC).resize(180, 180, { fit: 'cover' }).png({ compressionLevel: 9 })
  .toFile(path.join(PUBLIC, 'apple-touch-icon.png'));

const MASKABLE_SIZE = 512;
const INNER = Math.round(MASKABLE_SIZE * 0.7);
const offset = Math.round((MASKABLE_SIZE - INNER) / 2);
const inner = await sharp(SRC).resize(INNER, INNER, { fit: 'cover' }).png().toBuffer();
await sharp({
  create: {
    width: MASKABLE_SIZE,
    height: MASKABLE_SIZE,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  },
})
  .composite([{ input: inner, top: offset, left: offset }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(PUBLIC, 'icon-512-maskable.png'));

console.log('[gen-pwa-icons] done:');
console.log('  /icon-192.png');
console.log('  /icon-512.png');
console.log('  /icon-512-maskable.png (70% safe zone on black)');
console.log('  /apple-touch-icon.png');
