/* Render the existing application once per URL, for every visitor and crawler. */
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const { chromium } = require('playwright');
const { existsSync } = require('node:fs');

const root = path.resolve(__dirname, '..');
const origin = 'https://www.probiyom.com';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };

async function build() {
  const data = vm.createContext({});
  for (const file of ['scripts/helpers.js', 'scripts/site-routes.js', 'data/products.js', 'data/blogs.js']) {
    vm.runInContext(await fs.readFile(path.join(root, file), 'utf8'), data);
  }
  const routes = ['/', ...Object.keys(data.SiteRoutes.pages).filter(key => key !== 'home').map(key => data.SiteRoutes.href(key)),
    ...Object.keys(data.GroupSlugToEnum).map(slug => data.SiteRoutes.href('products/' + slug)),
    ...data.blogPosts.map(post => data.SiteRoutes.href('blog/' + data.blogSlug(post)))];
  if (new Set(routes).size !== routes.length) throw new Error('Duplicate route: check blog slugs.');
  const aliases = Object.fromEntries(data.blogPosts.map((post, index) => [data.SiteRoutes.href('blog/' + index), data.SiteRoutes.href('blog/' + data.blogSlug(post))]));
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); res.end(); return; }
      if (!path.extname(pathname)) file = path.join(root, 'index.html');
      const body = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    const installedChrome = process.platform === 'win32' && ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']
      .some(key => process.env[key] && existsSync(path.join(process.env[key], 'Google', 'Chrome', 'Application', 'chrome.exe')));
    const channel = process.env.CHROME_CHANNEL || (installedChrome ? 'chrome' : undefined);
    browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    // Never execute production analytics or contact external services during a build.
    await page.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const output = path.join(root, 'dist', 'seo-pages');
    await fs.mkdir(output, { recursive: true });
    let previous = { routes: [] };
    try { previous = JSON.parse(await fs.readFile(path.join(output, 'manifest.json'), 'utf8')); } catch {}
    const desired = new Set([...routes, ...Object.keys(aliases)].map(route => route.replace(/\/+$/, '')));
    for (const route of [...previous.routes, ...Object.keys(previous.aliases || {})].filter(route => !desired.has(route.replace(/\/+$/, '')))) {
      if (!/^\/[a-z0-9_/-]*$/.test(route) || route.includes('..')) throw new Error('Unsafe generated route');
      // Remove only obsolete generated HTML, never user assets or source files.
      await fs.rm(path.join(output, route.slice(1), 'index.html'), { force: true });
    }
    for (const route of [...routes, '/404/']) {
      await page.goto(base + route, { waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelector('#page-content h1') && document.title.includes(' | Probiyom'));
      if (route.startsWith('/blog/') && route !== '/blog/') await page.waitForSelector('.blog-detail-container');
      await page.waitForFunction(() => document.querySelector('#navbar-container a') && document.querySelector('#footer-container a'));
      if (errors.length) throw new Error(route + ': ' + errors.join('; '));
      const html = await page.evaluate(({ route }) => {
        const doc = document.documentElement.cloneNode(true);
        doc.querySelector('#page-content').setAttribute('data-prerender-route', route);
        doc.querySelector('#app-loader')?.remove();
        // Map canvas and controls initialize in the browser; the address remains in HTML.
        doc.querySelector('#contact-map')?.replaceChildren();
        // Answers remain readable without JS; FaqList restores the accordion on mount.
        doc.querySelectorAll('.faq-answer').forEach(answer => {
          answer.removeAttribute('inert');
          answer.style.maxHeight = 'none';
        });
        doc.querySelectorAll('.faq-question').forEach(button => button.setAttribute('aria-expanded', 'true'));
        doc.querySelectorAll('script[src]').forEach(script => {
          if (/^https?:/.test(script.getAttribute('src'))) script.remove();
        });
        const robots = doc.querySelector('meta[name="robots"]');
        if (route === '/404/') {
          robots.setAttribute('content', 'noindex, follow');
          doc.querySelector('link[rel="canonical"]')?.remove();
        }
        return '<!DOCTYPE html>\n' + doc.outerHTML;
      }, { route });
      const file = route === '/404/' ? path.join(output, '404.html') : path.join(output, route.slice(1), 'index.html');
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, html, 'utf8');
    }
    await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({ routes, aliases }, null, 2) + '\n');
    // Legacy numeric blog URLs share the canonical article document.
    for (const [alias, canonical] of Object.entries(aliases)) {
      const file = path.join(output, alias.slice(1), 'index.html');
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.copyFile(path.join(output, canonical.slice(1), 'index.html'), file);
    }
    // Publish sitemap only for routes generated from current datasets; omit unverified dates.
    const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      routes.map(route => '  <url><loc>' + origin + route + '</loc></url>').join('\n') + '\n</urlset>\n';
    await fs.writeFile(path.join(root, 'sitemap.xml'), sitemap);
    const dist = path.join(root, 'dist');
    await fs.mkdir(dist, { recursive: true });
    // Allowlist excludes tests, private tooling, source-server files and local caches.
    for (const name of ['data', 'images', 'pages', 'st', 'styles']) {
      await fs.cp(path.join(root, name), path.join(dist, name), { recursive: true, force: true });
    }
    await fs.mkdir(path.join(dist, 'scripts'), { recursive: true });
    for (const name of await fs.readdir(path.join(root, 'scripts'))) {
      if (name.endsWith('.js')) await fs.copyFile(path.join(root, 'scripts', name), path.join(dist, 'scripts', name));
    }
    for (const name of ['robots.txt', 'sitemap.xml', 'llms.txt', '_headers', 'google48726a64ae31bd98.html']) {
      await fs.copyFile(path.join(root, name), path.join(dist, name));
    }
    await fs.copyFile(path.join(output, 'index.html'), path.join(dist, 'index.html'));
    await fs.copyFile(path.join(output, '404.html'), path.join(dist, '404.html'));
    console.log('Built ' + routes.length + ' pages, true 404 document, sitemap and dist/ deployment package.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
build().catch(error => { console.error(error); process.exitCode = 1; });
