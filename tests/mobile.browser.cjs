const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const base = 'http://localhost:7076';
const routes = JSON.parse(fs.readFileSync('seo-pages/manifest.json', 'utf8')).routes;
const controls = 'button, .read-more-link, .back-to-blog-btn, .contact-social-btn, .mobile-fab-socials a';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.route(/googletagmanager/, route => route.abort());
    const page = await context.newPage();
    const errors = [], missing = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().startsWith(base + '/') && response.status() >= 400) missing.push(response.url()); });
    fs.mkdirSync('tests/screenshots', { recursive: true });
    for (const width of [320, 360, 390, 430, 768]) {
      await page.setViewportSize({ width, height: 844 });
      for (const route of routes) {
        const response = await page.goto(base + route);
        assert.equal(response.status(), 200, route);
        await page.waitForSelector('#app-loader', { state: 'detached' });
        const result = await page.evaluate(selector => {
          const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
          return {
            overflow: document.documentElement.scrollWidth - innerWidth,
            small: [...document.querySelectorAll(selector)].filter(visible).filter(el => { const r = el.getBoundingClientRect(); return r.width < 43.5 || r.height < 43.5; }).map(el => el.className),
            fields: [...document.querySelectorAll('.form-field input, .form-field select, .form-field textarea')].filter(visible).map(el => parseFloat(getComputedStyle(el).fontSize)),
            clipped: [...document.querySelectorAll('.product-card, .contact-item, .contact-item a, .form-field')].filter(visible).filter(el => { const r = el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(el => el.className),
            broken: [...document.querySelectorAll('#page-content img')].filter(img => img.complete && !img.naturalWidth).map(img => img.src)
          };
        }, controls);
        assert.ok(result.overflow <= 1, `${width} ${route}: horizontal overflow`);
        assert.deepEqual(result.clipped, [], `${width} ${route}: clipped content`);
        assert.deepEqual(result.small, [], `${width} ${route}: touch targets under 44px`);
        assert.ok(result.fields.every(size => size >= 16), `${width} ${route}: form text under 16px`);
        assert.deepEqual(result.broken, [], `${width} ${route}: broken images`);
        if ([320, 390].includes(width) && ['/', '/contact/', '/products/'].includes(route)) {
          await page.screenshot({ path: `tests/screenshots/mobile-${width}-${route.replaceAll('/', '') || 'home'}.png`, fullPage: true });
        }
      }
    }
    for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.goto(base + '/');
      await page.waitForSelector('#app-loader', { state: 'detached' });
      await page.locator('.navbar-mobile-btn').tap();
      const panel = page.locator('.mobile-menu-panel');
      const menu = await panel.evaluate(el => ({ bottom: el.getBoundingClientRect().bottom, height: innerHeight }));
      assert.ok(menu.bottom <= menu.height, 'Menu must fit a short or landscape viewport');
      await panel.evaluate(el => { el.scrollTop = el.scrollHeight; });
      await page.locator('.mobile-menu a[href="/contact/"]').tap();
      await page.waitForSelector('#contact-form');
      assert.equal(new URL(page.url()).pathname, '/contact/');
      assert.equal(await page.locator('.navbar-mobile-btn').getAttribute('aria-expanded'), 'false');
      await page.locator('#mobile-fab-trigger').tap();
      await page.locator('#mobile-fab-menu .mobile-fab-cta-btn').tap();
      await page.waitForSelector('#contact-modal.is-visible');
      const dialog = await page.locator('.contact-modal-dialog').evaluate(el => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: innerHeight }; });
      assert.ok(dialog.top >= 0 && dialog.bottom <= dialog.height, 'Contact dialog must fit the viewport');
      await page.locator('.contact-modal-close').tap();
      assert.equal(await page.locator('#contact-modal.is-visible').count(), 0);
      assert.notEqual(await page.locator('body').evaluate(el => el.style.overflow), 'hidden');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + '/products/professional_cleaning/');
    await page.waitForSelector('#app-loader', { state: 'detached' });
    await page.locator('#group-intro-slider .dock-btn-next').tap();
    assert.match(await page.locator('#group-intro-slider .dock-counter').innerText(), /02 \/ 09/);
    await page.goto(base + '/faq/');
    await page.locator('.faq-question').first().tap();
    assert.equal(await page.locator('.faq-question').first().getAttribute('aria-expanded'), 'true');
    assert.deepEqual(errors, [], 'Browser exceptions');
    assert.deepEqual(missing, [], 'Missing local resources');
    console.log(`PASS: ${routes.length} pages at 320/360/390/430/768px; 44px controls, readable forms, no clipping; touch menus, short/landscape dialogs, product carousel and FAQ.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
