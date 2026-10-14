// Run with NODE_PATH pointing at a Playwright installation.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    // Keep local regression runs out of production analytics.
    await page.route(/https:\/\/(?:www\.)?googletagmanager\.com\//, route => route.abort());
    const errors = [];
    const missing = [];
    const notFoundRoutes = ['/blog/nonexistent/', '/blog/999999/', '/about/extra/', '/products/home_cleaning/extra/'];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith('http://localhost:7076/') && response.status() >= 400 &&
          !(response.status() === 404 && notFoundRoutes.includes(new URL(response.url()).pathname))) missing.push(response.url());
    });
    const routes = ['/', '/about/', '/products/', '/contact/', '/faq/', '/blog/'];
    await page.goto('http://localhost:7076/');
    await page.waitForSelector('#page-content .seo-initial-content', { state: 'detached' });
    routes.push(...await page.evaluate(() => Object.keys(GroupSlugToEnum).map(slug => '/products/' + slug + '/')));
    routes.push(...await page.evaluate(() => blogPosts.map(post => '/blog/' + blogSlug(post) + '/')));
    fs.mkdirSync('tests/screenshots', { recursive: true });
    for (const width of (process.argv.includes('--interactions-only') ? [] : [1440, 390])) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await page.goto('http://localhost:7076' + route);
        await page.waitForSelector('#page-content .seo-initial-content', { state: 'detached' });
        await page.waitForSelector('#app-loader', { state: 'detached' });
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          h1: document.querySelector('#page-content h1')?.textContent,
          brokenImages: [...document.querySelectorAll('#page-content img')].filter(img => img.complete && !img.naturalWidth).map(img => img.src)
        }));
        assert.ok(result.h1, `Missing heading ${width} ${route}`);
        assert.ok(result.overflow <= 1, `Horizontal overflow ${width} ${route}: ${result.overflow}`);
        assert.deepEqual(result.brokenImages, [], `Broken images ${route}`);
        if (['/', '/contact/', '/products/'].includes(route)) await page.screenshot({ path: `tests/screenshots/${width}-${route.replace(/^\/|\/$/g, '') || 'home'}.png`, fullPage: true });
      }
    }
    // Never send a real email; intercept the service for failure and recovery checks.
    await page.goto('http://localhost:7076/contact/');
    await page.waitForSelector('#contact-form');
    let requests = 0;
    await page.route('https://api.web3forms.com/submit', async route => {
      requests++;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(requests === 1 ? {success:false,message:'<img src=x onerror=alert(1)>'} : {success:true}) });
    });
    await page.locator('[data-field="fullName"]').fill('Test Kullanıcı');
    await page.locator('[data-field="email"]').fill('invalid');
    await page.locator('[data-field="productGroup"]').selectOption({ index: 1 });
    await page.locator('[data-field="subject"]').selectOption({ index: 1 });
    assert.ok(await page.locator('.btn-submit').isDisabled());
    await page.locator('[data-field="email"]').fill('test@example.com');
    await page.locator('[data-field="phone"]').fill('05321234567');
    assert.equal(await page.locator('[data-field="phone"]').inputValue(), '+90 (532) 123 45 67');
    await page.locator('.btn-submit').click();
    await page.waitForSelector('.form-error');
    assert.equal(await page.locator('.form-error img').count(), 0);
    await page.locator('[data-field="message"]').fill('Test');
    assert.equal(await page.locator('.form-error').count(), 0);
    await page.locator('.btn-submit').click();
    await page.waitForSelector('.form-success');
    assert.equal(await page.locator('[data-field="fullName"]').inputValue(), '');
    assert.equal(requests, 2);
    for (const route of notFoundRoutes) {
      const response = await page.goto('http://localhost:7076' + route);
      assert.equal(response.status(), 404, 'Unknown routes must return a real HTTP 404');
      await page.waitForSelector('#page-content .seo-initial-content', { state: 'detached' });
      assert.match(await page.locator('#page-content').innerText(), /404|bulunamadı/i, route);
    }
    await page.goto('http://localhost:7076/faq/');
    await page.waitForSelector('.faq-question');
    await page.locator('.faq-question').first().click();
    assert.equal(await page.locator('.faq-question').first().getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('.faq-answer').first().getAttribute('inert'), null);
    await page.locator('.faq-question').first().click();
    assert.equal(await page.locator('.faq-question').first().getAttribute('aria-expanded'), 'false');
    await page.setViewportSize({width:390,height:900});
    await page.locator('.navbar-mobile-btn').click();
    assert.equal(await page.locator('.navbar-mobile-btn').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.navbar-mobile-btn').getAttribute('aria-expanded'), 'false');
    await page.locator('#mobile-fab-trigger').click();
    assert.equal(await page.locator('#mobile-fab-trigger').getAttribute('aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#mobile-fab-trigger').getAttribute('aria-expanded'), 'false');
    await page.setViewportSize({width:1440,height:900});
    await page.locator('#nav-contact-trigger').click();
    await page.waitForSelector('#contact-modal.is-visible');
    assert.equal(new URL(page.url()).pathname, '/faq/', 'Contact popup should not also navigate');
    assert.equal(await page.locator('#contact-modal [role="dialog"]').getAttribute('aria-modal'), 'true');
    await page.waitForFunction(() => document.querySelector('#contact-modal').contains(document.activeElement));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#contact-modal.is-visible').count(), 0);
    assert.ok(await page.locator('#nav-contact-trigger').evaluate(el => el === document.activeElement));
    await page.setViewportSize({width:800,height:900});
    assert.ok(await page.locator('.navbar-mobile-btn').isVisible());
    assert.ok(!await page.locator('.navbar-links').isVisible());
    await page.locator('.navbar-mobile-btn').click();
    await page.locator('.mobile-menu a[href="/blog/"]').click();
    await page.waitForSelector('.read-more-link');
    assert.equal(await page.locator('.navbar-mobile-btn').getAttribute('aria-expanded'), 'false');
    await page.locator('.read-more-link').first().focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.blog-detail-image img');
    await page.locator('.blog-detail-image img').focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('.blog-lightbox');
    await page.keyboard.press('Tab');
    assert.ok(await page.locator('.blog-lightbox-close').evaluate(el => el === document.activeElement));
    await page.keyboard.press('Escape');
    await page.waitForSelector('.blog-lightbox', {state:'detached'});
    assert.ok(await page.locator('.blog-detail-image img').evaluate(el => el === document.activeElement));
    await page.route('https://cdn.jsdelivr.net/npm/ol@*/**', route => route.abort());
    await page.goto('http://localhost:7076/contact/');
    await page.waitForFunction(() => document.querySelector('#contact-map')?.textContent.includes('Harita yüklenemedi'));
    // Reduced motion must leave a visible illustration and manual carousel controls.
    await page.setViewportSize({width:1440,height:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('http://localhost:7076/');
    await page.waitForSelector('.science-bg-slide');
    assert.equal(await page.locator('.science-bg-slide').first().evaluate(el => getComputedStyle(el).opacity), '1');
    assert.deepEqual(errors, [], 'Browser exceptions');
    assert.deepEqual(missing, [], 'Missing local resources');
    console.log(`PASS: ${process.argv.includes('--interactions-only') ? 'Focused interactions' : routes.length + ' routes at desktop/mobile'}, contact failure/recovery, menus/dialogs, keyboard blog/lightbox, map failure, reduced motion and invalid routes; no browser exceptions or missing local resources.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
