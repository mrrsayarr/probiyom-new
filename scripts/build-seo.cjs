/* Generate SEO HTML with the site's existing renderers in Node.js. */
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { parseHTML } = require('linkedom');

const root = path.resolve(__dirname, '..');
const origin = 'https://www.probiyom.com';
const noOp = () => {};
const excluded = new Set(['scripts/app.js', 'scripts/router.js', 'scripts/contact-map.js']);

async function build() {
  const shell = await fs.readFile(path.join(root, 'index.html'), 'utf8');
  const { document: sourceDocument } = parseHTML(shell);
  const scripts = [];
  for (const element of sourceDocument.querySelectorAll('script[src]')) {
    const name = element.getAttribute('src').split('?')[0];
    if (/^https?:/.test(name) || excluded.has(name)) continue;
    scripts.push([name, await fs.readFile(path.join(root, name), 'utf8')]);
  }
  const templates = new Map();
  for (const name of await fs.readdir(path.join(root, 'pages'))) {
    if (name.endsWith('.html')) templates.set('pages/' + name, await fs.readFile(path.join(root, 'pages', name), 'utf8'));
  }

  function renderContext(route) {
    const { document } = parseHTML(shell);
    const context = {
      document, URL, console,
      location: new URL(route, origin),
      scrollY: 0, innerWidth: 1440,
      addEventListener: noOp, removeEventListener: noOp, scrollTo: noOp,
      matchMedia: () => ({ matches: true }),
      setTimeout: () => 0, clearTimeout: noOp, setInterval: () => 0, clearInterval: noOp,
      requestAnimationFrame: () => 0, cancelAnimationFrame: noOp,
      Image: function () { return document.createElement('img'); },
      // Maps initialize on the visitor's device; the address is rendered below.
      ContactMap: () => ({ destroy: noOp }),
      fetch: () => { throw new Error('Network access is not part of the HTML build.'); }
    };
    context.window = context;
    context.Router = { getRouteHref: value => context.SiteRoutes.href(value), navigate: noOp };
    vm.createContext(context);
    for (const [name, code] of scripts) vm.runInContext(code, context, { filename: name, timeout: 5000 });
    return context;
  }

  const data = renderContext('/');
  const routes = ['/', ...Object.keys(data.SiteRoutes.pages).filter(key => key !== 'home').map(key => data.SiteRoutes.href(key)),
    ...Object.keys(data.GroupSlugToEnum).map(slug => data.SiteRoutes.href('products/' + slug)),
    ...data.blogPosts.map(post => data.SiteRoutes.href('blog/' + data.blogSlug(post)))];
  assert.equal(new Set(routes).size, routes.length, 'Duplicate route: check blog slugs.');
  const aliases = Object.fromEntries(data.blogPosts.map((post, index) => [data.SiteRoutes.href('blog/' + index), data.SiteRoutes.href('blog/' + data.blogSlug(post))]));
  const output = path.join(root, 'dist', 'seo-pages');
  await fs.mkdir(output, { recursive: true });
  let previous = { routes: [] };
  try { previous = JSON.parse(await fs.readFile(path.join(output, 'manifest.json'), 'utf8')); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const desired = new Set([...routes, ...Object.keys(aliases)].map(route => route.replace(/\/+$/, '')));
  for (const route of [...previous.routes, ...Object.keys(previous.aliases || {})].filter(route => !desired.has(route.replace(/\/+$/, '')))) {
    if (!/^\/[a-z0-9_/-]*$/.test(route) || route.includes('..')) throw new Error('Unsafe generated route');
    await fs.rm(path.join(output, route.slice(1), 'index.html'), { force: true });
  }

  const titles = new Set();
  for (const route of [...routes, '/404/']) {
    const context = renderContext(route);
    const document = context.document;
    const main = document.getElementById('page-content');
    const [page = 'home', parameter] = route.split('/').filter(Boolean);
    main.innerHTML = templates.get(route === '/404/' ? 'pages/not-found.html' : context.SiteRoutes.template(page, parameter));
    if (route === '/404/') {
      context.PageSEO.update('404 - Sayfa Bulunamadı', 'Aradığınız sayfa bulunamadı.', '404');
      document.querySelector('meta[name="robots"]').setAttribute('content', 'noindex, follow');
      document.querySelector('link[rel="canonical"]')?.remove();
    } else {
      context.PageControllers.mount(page, parameter, main);
    }
    context.Navbar(document.getElementById('navbar-container'));
    context.Footer(document.getElementById('footer-container'));
    main.setAttribute('data-prerender-route', route);
    document.getElementById('app-loader')?.remove();
    document.getElementById('contact-map')?.replaceChildren();
    document.querySelectorAll('.faq-answer').forEach(answer => {
      answer.removeAttribute('inert');
      answer.style.maxHeight = 'none';
    });
    document.querySelectorAll('.faq-question').forEach(button => button.setAttribute('aria-expanded', 'true'));
    // Image loading and decoding are properties in the renderers; emit real attributes.
    document.querySelectorAll('img').forEach(img => {
      if (img.loading) img.setAttribute('loading', img.loading);
      if (img.decoding) img.setAttribute('decoding', img.decoding);
    });
    document.querySelectorAll('script[src]').forEach(script => {
      if (/^https?:/.test(script.getAttribute('src'))) script.remove();
    });

    assert.equal(main.querySelectorAll('h1').length, 1, route + ': expected one main heading');
    assert.ok(!titles.has(document.title), route + ': duplicate page title');
    titles.add(document.title);
    if (route !== '/404/') assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), origin + route);
    const schema = document.getElementById('dynamic-schema');
    if (schema) JSON.parse(schema.textContent);
    if (page === 'blog' && parameter) assert.ok(main.querySelector('.blog-detail-text').textContent.length > 500, 'Empty article: ' + route);
    if (page === 'faq') assert.equal(main.querySelectorAll('.faq-question').length, context.faqs.length);

    const file = route === '/404/' ? path.join(output, '404.html') : path.join(output, route.slice(1), 'index.html');
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, '<!DOCTYPE html>\n' + document.documentElement.outerHTML, 'utf8');
  }

  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({ routes, aliases }, null, 2) + '\n');
  for (const [alias, canonical] of Object.entries(aliases)) {
    const file = path.join(output, alias.slice(1), 'index.html');
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.copyFile(path.join(output, canonical.slice(1), 'index.html'), file);
  }
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes.map(route => '  <url><loc>' + origin + route + '</loc></url>').join('\n') + '\n</urlset>\n';
  await fs.writeFile(path.join(root, 'sitemap.xml'), sitemap);
  const dist = path.join(root, 'dist');
  for (const name of ['data', 'images', 'pages', 'st', 'styles']) await fs.cp(path.join(root, name), path.join(dist, name), { recursive: true, force: true });
  await fs.mkdir(path.join(dist, 'scripts'), { recursive: true });
  for (const name of await fs.readdir(path.join(root, 'scripts'))) {
    if (name.endsWith('.js')) await fs.copyFile(path.join(root, 'scripts', name), path.join(dist, 'scripts', name));
  }
  for (const name of ['robots.txt', 'sitemap.xml', 'llms.txt', '_headers', 'google48726a64ae31bd98.html']) await fs.copyFile(path.join(root, name), path.join(dist, name));
  await fs.copyFile(path.join(output, 'index.html'), path.join(dist, 'index.html'));
  await fs.copyFile(path.join(output, '404.html'), path.join(dist, '404.html'));
  console.log('Built ' + routes.length + ' pages, true 404 document, sitemap and dist/ package using Node.js only.');
}
build().catch(error => { console.error(error); process.exitCode = 1; });
