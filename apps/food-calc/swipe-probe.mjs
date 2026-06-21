import { chromium } from '@playwright/test';

const BASE = 'https://localhost:5173';

async function probe(page, url, label) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const before = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('[data-embla-slide]'));
    const container = slides[0]?.parentElement ?? null;
    const carousel = document.querySelector('[data-carousel-container]');
    const r = carousel?.getBoundingClientRect();
    const cx = r ? r.left + r.width / 2 : 0;
    const cy = r ? r.top + r.height / 2 : 0;
    const topEl = document.elementFromPoint(cx, cy);
    const chain = [];
    let n = topEl;
    while (n) {
      chain.push(`${n.tagName.toLowerCase()}.${String(n.className).slice(0, 20)} ta=${getComputedStyle(n).touchAction} pe=${getComputedStyle(n).pointerEvents}`);
      if (n.hasAttribute && n.hasAttribute('data-carousel-container')) break;
      n = n.parentElement;
    }
    return {
      slideCount: slides.length,
      viewportW: Math.round(r?.width ?? 0),
      slideW: Math.round(slides[0]?.getBoundingClientRect().width ?? 0),
      transform: container ? getComputedStyle(container).transform : 'NO-CONTAINER',
      cx, cy,
      topEl: topEl ? `${topEl.tagName.toLowerCase()}.${String(topEl.className).slice(0,30)}` : 'NONE',
      chain,
    };
  });

  // Horizontal drag leftward.
  const sx = before.cx + before.viewportW * 0.3;
  const ex = before.cx - before.viewportW * 0.3;
  await page.mouse.move(sx, before.cy);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(sx + ((ex - sx) * i) / 12, before.cy);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  await page.waitForTimeout(700);

  const after = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('[data-embla-slide]'));
    const container = slides[0]?.parentElement ?? null;
    return container ? getComputedStyle(container).transform : 'NO-CONTAINER';
  });

  console.log(`\n===== ${label} (${url}) =====`);
  console.log('slideCount:', before.slideCount, 'viewportW:', before.viewportW, 'slideW:', before.slideW);
  console.log('topEl at center:', before.topEl);
  console.log('transform before:', before.transform);
  console.log('transform after :', after);
  console.log('MOVED:', before.transform !== after);
  console.log('touch-action / pointer-events chain (center → carousel):');
  before.chain.forEach((c) => console.log('  ', c));
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 420, height: 820 } });
const page = await ctx.newPage();
page.on('console', (m) => console.log(`[browser:${m.type()}]`, m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await probe(page, `${BASE}/suggestion_swipetest`, 'SCREEN slides (mimics Discoveries)');
await probe(page, `${BASE}/suggestion_swipetest?plain`, 'PLAIN div slides');

await browser.close();
