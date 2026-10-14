const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage();
    await page.route(/googletagmanager/, route => route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = 'http://localhost:7076';
    for (const input of ['/contact', '/contact/', '/#contact', '/#/contact/', '/index.html#contact']) {
      await page.goto(base + input);
      await page.waitForSelector('#contact-form');
      assert.equal(page.url(), base + '/contact/', input);
      await page.reload();
      await page.waitForSelector('#contact-form');
      assert.equal(page.url(), base + '/contact/');
    }
    await page.goto(base + '/#/products/home_cleaning/');
    await page.waitForSelector('#group-header h1');
    assert.equal(page.url(), base + '/products/home_cleaning/');
    await page.goto(base + '/blog/');
    await page.waitForSelector('.read-more-link');
    const slug = await page.evaluate(() => blogSlug(blogPosts[0]));
    await page.goto(base + '/#/blog/' + slug);
    await page.waitForSelector('.blog-detail-title');
    assert.equal(page.url(), base + '/blog/' + slug + '/');
    const posts = await page.evaluate(() => blogPosts.map(post => ({ slug: blogSlug(post), title: post.title })));
    const sharedSlugs = [
      'probiyotik-temizligin-gucu-uzun-sureli-ve-mikrobiyom-dostu-hijyen',
      'temizlikte-enzimler-probiyotiklerin-yerine-gecmez'
    ];
    for (const sharedSlug of sharedSlugs) assert.ok(posts.some(post => post.slug === sharedSlug), 'Previously shared article must remain available: ' + sharedSlug);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const post of posts) {
        for (const prefix of ['/#blog/', '/#/blog/']) {
          await page.goto(base + prefix + post.slug);
          await page.waitForSelector('.blog-detail-title');
          assert.equal(page.url(), base + '/blog/' + post.slug + '/', prefix + post.slug);
          assert.equal((await page.locator('.blog-detail-title').innerText()).trim(), post.title.replace(/\s+/g, ' ').trim());
          assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://www.probiyom.com/blog/' + post.slug + '/');
          assert.ok((await page.locator('.blog-detail-text').innerText()).length > 100, 'Article content must load');
        }
      }
    }
    for (const sharedSlug of sharedSlugs) {
      await page.goto(base + '/?utm_source=shared#blog/' + sharedSlug);
      await page.waitForSelector('.blog-detail-title');
      assert.equal(page.url(), base + '/blog/' + sharedSlug + '/?utm_source=shared');
      const refreshed = await page.reload();
      assert.equal(refreshed.status(), 200);
      await page.waitForSelector('.blog-detail-title');
      assert.equal(page.url(), base + '/blog/' + sharedSlug + '/?utm_source=shared');
    }
    await page.goto(base + '/about/');
    await page.waitForFunction(() => document.title.includes('Hakkımızda'));
    await page.evaluate(() => { window.location.hash = '#contact'; });
    await page.waitForSelector('#contact-form');
    assert.equal(page.url(), base + '/contact/');
    await page.evaluate(() => Router.navigate('faq'));
    await page.waitForSelector('.faq-question');
    await page.goBack();
    await page.waitForSelector('#contact-form');
    await page.goForward();
    await page.waitForSelector('.faq-question');
    await page.goto(base + '/faq/#faq-answer-0');
    await page.waitForSelector('.faq-question');
    assert.equal(page.url(), base + '/faq/#faq-answer-0');
    for (const input of ['/products/constructor/', '/products/toString', '/contact/extra/']) {
      await page.goto(base + input);
      await page.waitForFunction(() => document.title.includes('404'));
    }
    assert.deepEqual(errors, []);
    console.log('PASS: all 8 legacy blog links with #blog/ and #/blog/ at desktop/mobile; shared links preserve article content, canonical URLs, query strings and refresh; route navigation and invalid routes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
