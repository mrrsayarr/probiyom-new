const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

(async () => {
 const browser = await chromium.launch({channel:'chrome',headless:true});
 try {
  const page = await browser.newPage();
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const tags = [];
  await page.route(/https:\/\/(?:www\.)?googletagmanager\.com\//, route => {tags.push(route.request().url()); return route.abort();});
  const base = 'http://localhost:7076';
  await page.goto(base + '/blog');
  await page.waitForSelector('.blog-post');
  assert.equal(await page.locator('.blog-post').count(), 8);
  const source = {};
  vm.createContext(source);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../hash-probiyom/data/blogs.js'),'utf8'),source);
  const posts = await page.evaluate(() => blogPosts.map(p => ({...p, slug:blogSlug(p)})));
  assert.deepEqual(posts.map(p=>p.title), Array.from(source.blogPosts,p=>p.title));
  for(const post of posts) {
    const original = source.blogPosts.find(p=>p.title===post.title);
    assert.equal(post.text, original.text.replace(/href="#\/?(products\/[^"\s]+)"/g,'href="/$1"'));
  }
  await page.locator('.read-more-link').first().click();
  await page.waitForSelector('.blog-detail-title');
  assert.equal(new URL(page.url()).pathname,'/blog/' + posts[0].slug);
  assert.equal(await page.locator('.blog-detail-text h2').count(),5);
  assert.equal(await page.locator('.blog-detail-text a').count(),3);
  assert.equal(await page.locator('.blog-detail-text a[href^="#"]').count(),0);
  assert.ok(!(await page.locator('.blog-detail-text').innerText()).includes('<h2>'));
  fs.mkdirSync('tests/screenshots',{recursive:true});
  await page.screenshot({path:'tests/screenshots/imported-blog-desktop.png'});
  await page.locator('.blog-detail-text a[href="/products/pet"]').click();
  await page.waitForSelector('#group-products .product-card');
  assert.equal(new URL(page.url()).pathname,'/products/pet');
  await page.goto(base + '/');
  await page.waitForSelector('#home-slider .slider-slide');
  assert.equal(await page.locator('#home-slider .slider-slide').count(),7);
  const assets = await page.evaluate(() => [...new Set([...homeSlides.map(s=>s.src),...ProductCategories.map(c=>c.image),...blogPosts.map(p=>p.imageDir)])]);
  for(const asset of assets) {
    const response = await page.request.get(base + '/' + asset);
    assert.equal(response.status(),200,asset);
    assert.match(response.headers()['content-type'],/^image\//,asset);
  }
  await page.locator('#home-slider .dock-btn-next').click();
  assert.match(await page.locator('#home-slider .dock-counter').innerText(),/02 \/ 07/);
  await page.locator('#home-slider').screenshot({path:'tests/screenshots/imported-home-gallery.png'});
  await page.goto(base + '/products');
  await page.waitForSelector('.category-card-link');
  assert.equal(await page.locator('.category-card-link').count(),7);
  assert.equal(await page.locator('#products-slider, #page-content .slider-wrapper').count(),0);
  assert.equal(await page.locator('.category-card-link[href^="#"]').count(),0);
  assert.ok(tags.some(url => url.includes('GTM-578BDWC9')));
  const shell = await page.request.get(base + '/index.html');
  const shellHtml = await shell.text();
  assert.equal((shellHtml.match(/GTM-578BDWC9/g)||[]).length,2);
  await page.goto(base + '/st/');
  assert.equal(await page.title(),'Probiyom Satış Teklifi Oluşturucu');
  assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
  assert.equal((await page.request.head(base + '/st/')).status(),200);
  assert.deepEqual(errors,[]);
  console.log('PASS: 8 source blogs preserved, headings/links safe and functional, all gallery assets served, 7 selected home slides + 7 product category cards, GTM and standalone quote page.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
