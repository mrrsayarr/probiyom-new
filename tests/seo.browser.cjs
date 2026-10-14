const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const manifest = JSON.parse(fs.readFileSync('seo-pages/manifest.json', 'utf8'));

(async () => {
  const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL || 'chrome', headless: true });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false });
    await context.route(/googletagmanager/, route => route.abort());
    const page = await context.newPage();
    const titles = new Set();
    for (const route of manifest.routes) {
      const response = await page.goto('http://localhost:7076' + route);
      assert.equal(response.status(), 200, route);
      assert.equal(await page.locator('#page-content h1').count(), 1, route + ' should have one main heading');
      assert.ok(await page.locator('#page-content h1').isVisible(), route + ' must have readable content without JS');
      const title = await page.title();
      assert.ok(!titles.has(title), route + ' must have a unique title');
      titles.add(title);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      assert.equal(canonical, 'https://www.probiyom.com' + route);
      assert.equal(await page.locator('meta[name="twitter:url"]').getAttribute('content'), canonical);
      assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), canonical);
      const nonCanonicalLinks = await page.locator('a[href]').evaluateAll(links => links
        .map(link => link.getAttribute('href'))
        .filter(href => /^\/(?:about|products|contact|faq|blog)(?:\/|$)/.test(href))
        .filter(href => !new URL(href, location.origin).pathname.endsWith('/')));
      assert.deepEqual(nonCanonicalLinks, [], route + ' internal page links must use a trailing slash');
      if (route === '/faq/') assert.ok(await page.locator('.faq-answer-inner p').first().isVisible(), 'FAQ answers must be readable without JS');
      if (route.startsWith('/blog/') && route !== '/blog/') {
        assert.ok((await page.locator('.blog-detail-text').innerText()).length > 500);
        assert.equal(await page.locator('meta[property="og:type"]').getAttribute('content'), 'article');
        const schema = JSON.parse(await page.locator('#dynamic-schema').textContent());
        assert.equal(schema['@type'], 'BlogPosting');
        assert.ok(!schema.datePublished && !schema.dateModified, 'Unknown dates must not be fabricated');
      }
    }
    const missing = await page.goto('http://localhost:7076/no-such-page');
    assert.equal(missing.status(), 404);
    assert.match(await page.locator('meta[name="robots"]').getAttribute('content'), /noindex/);
    assert.match(await page.locator('#page-content').innerText(), /404/);
    assert.equal((await page.request.head('http://localhost:7076/no-such-page')).status(), 404);
    await context.close();
    const interactive = await browser.newPage();
    await interactive.route(/googletagmanager/, route => route.abort());
    const blog = manifest.routes.find(route => route.startsWith('/blog/') && route !== '/blog/');
    await interactive.goto('http://localhost:7076/#' + blog.slice(1));
    await interactive.waitForSelector('.blog-detail-container');
    assert.equal(new URL(interactive.url()).pathname, blog);
    assert.equal(new URL(interactive.url()).hash, '');
    await interactive.locator('.back-to-blog-btn').first().click();
    await interactive.waitForSelector('.blog-post');
    assert.equal(new URL(interactive.url()).pathname, '/blog/');
    await interactive.goto('http://localhost:7076/no-such-page');
    await interactive.waitForFunction(() => document.title.startsWith('404'));
    await interactive.locator('.btn-404-home').click();
    await interactive.waitForSelector('#home-slider .slider-slide');
    assert.ok(!(await interactive.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));
    console.log('PASS: 21 pages without JavaScript, unique canonical/social metadata, full blog content, true GET/HEAD 404, legacy hashes and interactive navigation.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
