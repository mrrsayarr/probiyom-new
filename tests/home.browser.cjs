const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    const page = await browser.newPage();
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.route(/https:\/\/(?:www\.)?googletagmanager\.com\//, route => route.abort());
    const errors = [];
    const missing = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', res => {
      if (res.url().startsWith('http://localhost:7076/') && res.status() >= 400) missing.push(res.url());
    });
    fs.mkdirSync('tests/screenshots', {recursive: true});
    for (const width of [1440, 390]) {
      await page.setViewportSize({width, height: 900});
      await page.goto('http://localhost:7076/');
      await page.waitForSelector('.pathogen-chart__svg');
      assert.equal(await page.locator('.pathogen-chart__area').count(), 2);
      assert.equal(await page.locator('.pathogen-trend__insight').count(), 3);
      assert.match(await page.locator('.pathogen-chart__line').first().getAttribute('d'), / C /);
      await page.waitForSelector('#app-loader', {state: 'detached'});
      assert.equal(await page.locator('#page-content > section').first().getAttribute('class'), 'page-section home-opening');
      const bounds = await page.evaluate(() => {
        const frame = document.querySelector('#home-slider .slider-frame').getBoundingClientRect();
        const dock = document.querySelector('#home-slider .slider-dock-container').getBoundingClientRect();
        const image = document.querySelector('#home-slider .slider-image-container').getBoundingClientRect();
        return {top: dock.top - frame.top, right: frame.right - dock.right, inside: dock.bottom < frame.bottom, imageTop: image.top - frame.top};
      });
      assert.ok(bounds.top >= 10 && bounds.top <= 20 && bounds.right >= 10 && bounds.right <= 20 && bounds.inside, JSON.stringify(bounds));
      assert.ok(bounds.imageTop <= 2, 'The image must start at the frame edge without a control spacer');
      const expectedSlides = ['hp_1', 'hp_10', 'hp_2', 'hp_3', 'hp_8', 'hp_5', 'hp_7'].map(name => `images/homepage_sliders/${name}.webp`);
      assert.deepEqual(await page.locator('#home-slider .slider-slide img').evaluateAll(images => images.map(img => img.getAttribute('src'))), expectedSlides);
      assert.equal(await page.locator('#home-slider .slider-slide').count(), 7);
      await page.locator('#home-slider .dock-btn-next').click();
      assert.match(await page.locator('#home-slider .dock-counter').innerText(), /02 \/ 07/);
      await page.locator('#home-slider .dock-btn-prev').click();
      await page.screenshot({path: `tests/screenshots/home-opening-${width}.png`});
      const point = page.locator('.pathogen-chart__point[data-series="probiotic"][data-index="3"]');
      await point.scrollIntoViewIfNeeded();
      await point.hover();
      assert.match(await page.locator('.pathogen-chart__detail').innerText(), /24\. Saat/);
      await point.focus();
      await page.keyboard.press('Enter');
      assert.equal(await point.getAttribute('aria-pressed'), 'true');
      await page.locator('.pathogen-chart__filter[data-filter="chemical"]').click();
      assert.equal(await page.locator('.pathogen-chart__series--chemical').getAttribute('data-visible'), 'false');
      await page.locator('.pathogen-chart__filter').first().click();
      assert.equal(await page.locator('.pathogen-chart__series--chemical').getAttribute('data-visible'), 'true');
      await page.locator('.pathogen-trend__panel').scrollIntoViewIfNeeded();
      const chartLayout = await page.evaluate(() => {
        const panel = document.querySelector('.pathogen-trend__panel').getBoundingClientRect();
        const aside = document.querySelector('.pathogen-trend aside').getBoundingClientRect();
        return {beside: aside.left >= panel.right, below: aside.top >= panel.bottom};
      });
      assert.ok(width >= 992 ? chartLayout.beside : chartLayout.below, 'Chart insights must sit beside the plot on desktop and below on mobile');
      await page.locator('.pathogen-trend').screenshot({path: `tests/screenshots/pathogen-chart-${width}.png`, style: '#navbar-container { visibility: hidden; }'});
      const categories = page.locator('.category-media img');
      assert.equal(await categories.count(), 7);
      assert.deepEqual(await categories.evaluateAll(images => images.map(img => img.getAttribute('src'))),
        [1, 2, 3, 4, 6, 7, 8].map(index => `images/products_sliders/ps_${index}.webp`));
      for (const image of await categories.all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(img => img.decode());
      }
      const homeCategories = await page.locator('[data-category-grid]').innerHTML();
      await page.locator('[data-category-grid]').screenshot({path: `tests/screenshots/home-categories-${width}.png`, style: '.navbar { visibility: hidden; }'});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.goto('http://localhost:7076/products');
      await page.waitForSelector('.category-card-link');
      assert.equal(await page.locator('#products-slider, #page-content .slider-wrapper').count(), 0);
      assert.equal(await page.locator('.category-card-link').count(), 7);
      assert.equal(await page.locator('[data-category-grid]').innerHTML(), homeCategories, 'Both pages must use identical category content');
      for (const image of await page.locator('.category-media img').all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(img => img.decode());
      }
      await page.locator('[data-category-grid]').screenshot({path: `tests/screenshots/products-categories-${width}.png`, style: '.navbar { visibility: hidden; }'});
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.locator('.category-card-link').last().click();
      await page.waitForSelector('#group-products .product-card');
      assert.equal(new URL(page.url()).pathname, '/products/pet');
      await page.evaluate(() => Router.navigate('products'));
      await page.waitForSelector('.category-card-link');
      assert.equal(await page.locator('#page-content .slider-wrapper').count(), 0);
      await page.goto('http://localhost:7076/products/professional_cleaning');
      await page.waitForSelector('#group-intro-slider .slider-frame');
      assert.equal(await page.locator('#group-intro-slider .slider-wrapper--controls-top-right').count(), 0);
      await page.evaluate(() => Router.navigate('home'));
      await page.waitForSelector('.pathogen-chart__svg');
      assert.equal(await page.locator('[data-pathogen-chart-instance]').count(), 1);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(missing, []);
    console.log('PASS: desktop/mobile home slider and chart, 7 shared category cards, products without slider, category navigation, and group slider preserved.');
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
