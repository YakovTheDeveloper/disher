import { chromium } from '@playwright/test';

const BASE = 'https://localhost:5173';

async function probe(page, url, label) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Vite HMR keeps a socket open → never "networkidle". Wait for slides instead.
  await page.waitForSelector('[data-embla-slide]', { timeout: 15000 });
  await page.waitForTimeout(1200);

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
      const cs = getComputedStyle(n);
      chain.push(
        `${n.tagName.toLowerCase()}.${String(n.className).slice(0, 22)} ta=${cs.touchAction} pe=${cs.pointerEvents} ovx=${cs.overflowX} ovy=${cs.overflowY}`
      );
      if (n.hasAttribute && n.hasAttribute('data-carousel-container')) break;
      n = n.parentElement;
    }
    return {
      slideCount: slides.length,
      viewportW: Math.round(r?.width ?? 0),
      viewportH: Math.round(r?.height ?? 0),
      slideW: Math.round(slides[0]?.getBoundingClientRect().width ?? 0),
      slideLefts: slides.map((s) => Math.round(s.getBoundingClientRect().left)),
      transform: container ? getComputedStyle(container).transform : 'NO-CONTAINER',
      cx, cy,
      topEl: topEl ? `${topEl.tagName.toLowerCase()}.${String(topEl.className).slice(0, 34)}` : 'NONE',
      chain,
    };
  });

  // Horizontal drag leftward (advance to next slide).
  const sx = before.cx + before.viewportW * 0.32;
  const ex = before.cx - before.viewportW * 0.32;
  await page.mouse.move(sx, before.cy);
  await page.mouse.down();
  for (let i = 1; i <= 14; i++) {
    await page.mouse.move(sx + ((ex - sx) * i) / 14, before.cy);
    await page.waitForTimeout(14);
  }
  await page.mouse.up();
  await page.waitForTimeout(700);

  const after = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('[data-embla-slide]'));
    const container = slides[0]?.parentElement ?? null;
    return {
      transform: container ? getComputedStyle(container).transform : 'NO-CONTAINER',
      slideLefts: slides.map((s) => Math.round(s.getBoundingClientRect().left)),
    };
  });

  const moved = before.transform !== after.transform;
  console.log(`\n===== ${label} =====`);
  console.log('url:', url);
  console.log('slideCount:', before.slideCount, 'viewportW:', before.viewportW, 'viewportH:', before.viewportH, 'slideW:', before.slideW);
  console.log('slideLefts before:', JSON.stringify(before.slideLefts), '→ after:', JSON.stringify(after.slideLefts));
  console.log('topEl at center:', before.topEl);
  console.log('transform before:', before.transform);
  console.log('transform after :', after.transform);
  console.log('>>> MOVED:', moved ? 'YES (swipe works)' : 'NO (swipe DEAD)');
  console.log('chain (center → carousel):');
  before.chain.forEach((c) => console.log('   ', c));
  return moved;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 420, height: 820 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

const results = {};
results['SCREEN  default0 (Discoveries shape)'] = await probe(page, `${BASE}/suggestion_swipetest`, 'SCREEN slides, defaultSlide 0  (== Discoveries)');
results['SCREEN  default1 (Home shape)']        = await probe(page, `${BASE}/suggestion_swipetest?default=1`, 'SCREEN slides, defaultSlide 1  (== Home)');
results['PLAIN   default0']                      = await probe(page, `${BASE}/suggestion_swipetest?plain`, 'PLAIN div slides, defaultSlide 0');
results['PLAIN   default1']                      = await probe(page, `${BASE}/suggestion_swipetest?plain&default=1`, 'PLAIN div slides, defaultSlide 1');

console.log('\n================ SUMMARY ================');
for (const [k, v] of Object.entries(results)) console.log(`${v ? '✅ works' : '❌ DEAD '}  ${k}`);

await browser.close();
