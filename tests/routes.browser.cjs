const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = 'http://localhost:7076';
    for (const input of ['/contact', '/contact/', '/#contact', '/#/contact', '/index.html#contact']) {
      await page.goto(base + input);
      await page.waitForSelector('#contact-form');
      assert.equal(page.url(), base + '/contact', input);
      await page.reload();
      await page.waitForSelector('#contact-form');
      assert.equal(page.url(), base + '/contact');
    }
    await page.goto(base + '/#/products/home_cleaning');
    await page.waitForSelector('#group-header h1');
    assert.equal(page.url(), base + '/products/home_cleaning');
    await page.goto(base + '/blog');
    await page.waitForSelector('.read-more-link');
    const slug = await page.evaluate(() => blogSlug(blogPosts[0]));
    await page.goto(base + '/#/blog/' + slug);
    await page.waitForSelector('.blog-detail-title');
    assert.equal(page.url(), base + '/blog/' + slug);
    await page.goto(base + '/about');
    await page.waitForFunction(() => document.title.includes('Hakkımızda'));
    await page.evaluate(() => { window.location.hash = '#contact'; });
    await page.waitForSelector('#contact-form');
    assert.equal(page.url(), base + '/contact');
    await page.evaluate(() => Router.navigate('faq'));
    await page.waitForSelector('.faq-question');
    await page.goBack();
    await page.waitForSelector('#contact-form');
    await page.goForward();
    await page.waitForSelector('.faq-question');
    await page.goto(base + '/faq/#faq-answer-0');
    await page.waitForSelector('.faq-question');
    assert.equal(page.url(), base + '/faq#faq-answer-0');
    for (const input of ['/products/constructor', '/products/toString', '/contact/extra']) {
      await page.goto(base + input);
      await page.waitForFunction(() => document.title.includes('404'));
    }
    assert.deepEqual(errors, []);
    console.log('PASS: clean/trailing/legacy hash URLs, refresh, product/blog deep links, hash changes, back/forward, content fragments and invalid routes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
