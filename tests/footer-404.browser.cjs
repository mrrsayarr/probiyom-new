const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.route(/googletagmanager/, route => route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('http://localhost:7076/contact');
      await page.locator('.footer').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('footer footer').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, width + 'px overflow');
      const targets = await page.locator('.footer .social-icon-btn').evaluateAll(items => items.map(el => ({w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height})));
      assert.ok(targets.every(size => size.w >= 44 && size.h >= 44), 'Social touch targets');
      await page.locator('.footer').screenshot({path: `tests/screenshots/footer-${width}.png`});
      if (width === 390) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.screenshot({path: 'tests/screenshots/footer-bottom-390.png'});
        const overlap = await page.evaluate(() => {
          const copy = document.querySelector('.footer-copy').getBoundingClientRect();
          const fab = document.querySelector('#mobile-fab-trigger').getBoundingClientRect();
          return copy.bottom > fab.top;
        });
        assert.equal(overlap, false, 'Floating social button must not cover footer bottom');
      }
      const response = await page.goto('http://localhost:7076/bu-sayfa-yok');
      assert.equal(response.status(), 404);
      await page.waitForSelector('.not-found');
      assert.equal(new URL(page.url()).pathname, '/bu-sayfa-yok');
      assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
      if (width === 390 || width === 1440) await page.screenshot({path: `tests/screenshots/not-found-${width}.png`});
      await page.locator('.not-found-blog').click();
      await page.waitForSelector('.blog-post');
      assert.equal(new URL(page.url()).pathname, '/blog');
    }
    assert.deepEqual(errors, []);
    console.log('PASS: footer at 320/390/768/1440px, touch targets, no overflow, true 404 and recovery links.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
