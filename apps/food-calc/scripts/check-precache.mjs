// Ратчет precache: картинки НЕ должны попадать в precache-манифест.
//
// ЗАЧЕМ. 2026-07-14 precache сжат с 542 записей / 18.1 MB до 29 / 3.1 MB — картинки
// уехали в runtimeCaching (CacheFirst). Весь выигрыш держится на ОДНОЙ строке
// `globPatterns` в vite.config.ts. Дописать туда `png,webp` обратно — однострочная
// правка с благим намерением («чтобы офлайн работал»), которая молча вернёт 18 MB
// и 413 запросов на первый заход. Ни один существующий гейт этого не поймает:
// типы, линт и стили останутся зелёными.
//
// Офлайн от этого НЕ страдает: runtime-роут кеширует картинку по факту показа
// (см. комментарий у runtimeCaching). Прогрева нет и заводить его не надо —
// см. memory feedback-pwa-precache-intentional.
//
// Проверка статическая (по исходнику конфига), чтобы работать в pre-commit без
// сборки. Если рядом лежит собранный dist/sw.js — сверяем ещё и реальный манифест.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const CONFIG = 'vite.config.ts';
const SW = 'dist/sw.js';

// Растровые форматы. svg оставлен намеренно: иконки интерфейса, 11 штук, ~несколько KB.
const RASTER = ['png', 'webp', 'jpg', 'jpeg', 'jfif', 'gif', 'avif'];

// PWA-иконки приходят в precache через includeAssets (не через globPatterns) — они
// нужны офлайн для установленного приложения и это единственные легальные png.
const ALLOWED_PNG = new Set([
  'icon-192.png',
  'icon-512.png',
  'icon-512-maskable.png',
  'apple-touch-icon.png',
]);

const fail = (msg) => {
  console.error(`✗ precache: ${msg}`);
  process.exit(1);
};

// ── 1. Исходник конфига ──────────────────────────────────────────────────────
const config = await readFile(CONFIG, 'utf8');
const globs = config.match(/globPatterns:\s*\[([^\]]*)\]/);
if (!globs) fail(`не нашёл globPatterns в ${CONFIG} — переименовали или удалили?`);

const leaked = RASTER.filter((ext) => new RegExp(`\\b${ext}\\b`).test(globs[1]));
if (leaked.length) {
  fail(
    `растровые форматы вернулись в globPatterns: ${leaked.join(', ')}.\n` +
      `  Это втянет ~400 картинок каталога в precache при install (было 18.1 MB / 413 запросов).\n` +
      `  Картинки кешируются runtime-роутом по факту показа — офлайн от этого не страдает.`,
  );
}

// ── 2. Собранный манифест, если он есть ──────────────────────────────────────
if (existsSync(SW)) {
  const sw = await readFile(SW, 'utf8');
  const urls = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);
  if (!urls.length) fail(`${SW} есть, но записей манифеста в нём не видно — сменился формат?`);

  const offenders = urls.filter((u) => {
    const ext = u.split('.').pop()?.toLowerCase();
    if (!RASTER.includes(ext)) return false;
    return !ALLOWED_PNG.has(u.split('/').pop());
  });

  if (offenders.length) {
    fail(
      `в precache-манифесте ${offenders.length} картинок:\n  ${offenders.slice(0, 8).join('\n  ')}` +
        (offenders.length > 8 ? `\n  … и ещё ${offenders.length - 8}` : ''),
    );
  }
  console.log(`✓ precache: ${urls.length} записей, картинок нет (dist сверен)`);
} else {
  console.log('✓ precache: globPatterns без растровых форматов (dist не собран — манифест не сверял)');
}
