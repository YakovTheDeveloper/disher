import { chromium, devices } from '@playwright/test';

const BASE = 'https://localhost:5173';

async function analyze(page, url, label, { touch }) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-embla-slide]', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // 1) Horizontal-overflow scan: any element inside the active slide whose
  //    scrollWidth exceeds its clientWidth is a candidate native-pan-x thief.
  const overflow = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('[data-embla-slide]'));
    // active slide = the one covering the carousel centre
    const carousel = document.querySelector('[data-carousel-container]');
    const cr = carousel.getBoundingClientRect();
    const cx = cr.left + cr.width / 2;
    const active =
      slides.find((s) => {
        const r = s.getBoundingClientRect();
        return cx >= r.left && cx <= r.right;
      }) ?? slides[0];

    const offenders = [];
    active.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el);
      const horizPannable =
        cs.overflowX === 'auto' || cs.overflowX === 'scroll';
      const overflowsX = el.scrollWidth - el.clientWidth > 1;
      if (overflowsX && horizPannable) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className).slice(0, 40),
          scrollW: el.scrollWidth,
          clientW: el.clientWidth,
          overflowX: cs.overflowX,
          touchAction: cs.touchAction,
        });
      }
    });
    // Also report the .screen scroller specifically (the prime suspect).
    const screenEl = active.querySelector('[class*="screen__"]') || active.querySelector('[class*="Screen-screen"]');
    const screenInfo = screenEl
      ? {
          scrollW: screenEl.scrollWidth,
          clientW: screenEl.clientWidth,
          overflowsX: screenEl.scrollWidth - screenEl.clientWidth,
          overflowX: getComputedStyle(screenEl).overflowX,
          touchAction: getComputedStyle(screenEl).touchAction,
        }
      : 'no .screen found';
    return { offenders, screenInfo, slideCount: slides.length, viewportW: Math.round(cr.width) };
  });

  // 2) Drag (touch via CDP, or mouse) and see if Embla moved.
  const geom = await page.evaluate(() => {
    const carousel = document.querySelector('[data-carousel-container]');
    const r = carousel.getBoundingClientRect();
    const slides = Array.from(document.querySelectorAll('[data-embla-slide]'));
    const container = slides[0]?.parentElement ?? null;
    return {
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      w: r.width,
      transform: container ? getComputedStyle(container).transform : 'NONE',
    };
  });

  const sx = geom.cx + geom.w * 0.32;
  const ex = geom.cx - geom.w * 0.32;
  const steps = 14;

  if (touch) {
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: sx, y: geom.cy }],
    });
    for (let i = 1; i <= steps; i++) {
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: sx + ((ex - sx) * i) / steps, y: geom.cy }],
      });
      await page.waitForTimeout(14);
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(sx, geom.cy);
    await page.mouse.down();
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(sx + ((ex - sx) * i) / steps, geom.cy);
      await page.waitForTimeout(14);
    }
    await page.mouse.up();
  }
  await page.waitForTimeout(800);

  const after = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('[data-embla-slide]'));
    const container = slides[0]?.parentElement ?? null;
    return container ? getComputedStyle(container).transform : 'NONE';
  });

  const moved = geom.transform !== after;
  console.log(`\n===== ${label}  [${touch ? 'TOUCH' : 'MOUSE'}] =====`);
  console.log('url:', url, '| slides:', overflow.slideCount, '| viewportW:', overflow.viewportW);
  console.log('.screen scroller:', JSON.stringify(overflow.screenInfo));
  console.log('horizontal-pannable offenders inside active slide:', overflow.offenders.length);
  overflow.offenders.forEach((o) => console.log('   ⚠', JSON.stringify(o)));
  console.log('transform:', geom.transform, '→', after);
  console.log('>>> MOVED:', moved ? 'YES (swipe works)' : 'NO (swipe DEAD)');
  return { moved, offenders: overflow.offenders.length, screenOverflowX: overflow.screenInfo?.overflowsX };
}

const browser = await chromium.launch();
const iPhone = devices['iPhone 13'];
const ctx = await browser.newContext({
  ...iPhone,
  ignoreHTTPSErrors: true,
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

const results = {};
results['REAL Discoveries — MOUSE'] = await analyze(page, `${BASE}/suggestion_swipetest?real`, 'REAL Discoveries slides', { touch: false });
results['REAL Discoveries — TOUCH'] = await analyze(page, `${BASE}/suggestion_swipetest?real`, 'REAL Discoveries slides', { touch: true });
results['DUMMY tall — TOUCH']       = await analyze(page, `${BASE}/suggestion_swipetest`, 'DUMMY Screen slides', { touch: true });

console.log('\n================ SUMMARY ================');
for (const [k, v] of Object.entries(results))
  console.log(`${v.moved ? '✅ works' : '❌ DEAD '}  ${k}  (offenders=${v.offenders}, .screen overflowX=${v.screenOverflowX}px)`);

await browser.close();
