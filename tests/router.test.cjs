const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const modules = ['site-routes', 'page-seo', 'category-grid', 'home-page', 'page-controllers', 'router'];

function createRouter(initialPath, fetchImpl, initialHash) {
  const events = [];
  const listeners = {};
  const container = { innerHTML: '', querySelector(selector) { return document.getElementById(selector.slice(1)); } };
  const state = { dynamicSchema: null, title: '', metas: [], events };
  const document = {
    set title(value) { state.title = value; },
    head: {
      appendChild(node) { node.parentNode = document.head; if (node.id === 'dynamic-schema') state.dynamicSchema = node; },
      removeChild(node) { node.parentNode = null; if (node === state.dynamicSchema) state.dynamicSchema = null; }
    },
    addEventListener(type, listener) { (listeners[type] || (listeners[type] = [])).push(listener); },
    dispatchEvent(event) { events.push(event); },
    getElementById(id) {
      if (id === 'dynamic-schema') return state.dynamicSchema;
      if (id === 'fragment-target') return { scrollIntoView() { state.fragmentScrolled = true; } };
      return null;
    },
    querySelector() { return null; },
    createElement(tag) {
      return {
        tagName: tag,
        parentNode: null,
        setAttribute(name, value) { this[name] = value; },
      remove() { this.parentNode = null; }
      };
    }
  };
  const window = {
    location: { pathname: initialPath, origin: 'https://example.test', search: '', hash: initialHash || '' },
    history: {
      replaceState(_state, _title, url) { setLocation(url); },
      pushState(_state, _title, url) { setLocation(url); }
    },
    addEventListener(type, listener) { (listeners[type] || (listeners[type] = [])).push(listener); },
    scrollTo() {}
  };
  function setLocation(url) {
    const parsed = new URL(url, window.location.origin);
    window.location.pathname = parsed.pathname;
    window.location.search = parsed.search;
    window.location.hash = parsed.hash;
  }
  const context = {
    window,
    document,
    URL,
    CustomEvent: class CustomEvent { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    fetch: fetchImpl || ((url) => Promise.resolve({ ok: true, text: () => Promise.resolve('<main>' + url + '</main>') })),
    GroupSlugToEnum: { home: 0 },
    ProductGroupLabels: {},
    ProductGroupIntroText: {},
    products: [],
    blogPosts: [
      { title: 'Birinci yazı', slug: 'birinci-yazi', text: 'İlk paragraf' },
      { title: 'İkinci yazı', slug: 'ikinci-yazi', text: 'İkinci paragraf' }
    ],
    faqs: [],
    SiteData: { address1: '', address2: '', phone: '', email: '', instagram: '', x: '', linkedin: '', youtube: '', lat: 0, lon: 0 },
    blogSlug(post) { return post.slug; },
    findBlogIndexBySlug(slug, posts) { return posts.findIndex((post) => post.slug === slug); },
    escapeHtml(value) { return String(value || ''); },
    escapeAttr(value) { return String(value || ''); },
    formatText(value) { return String(value || ''); },
    ImageSlider() { return { destroy() {} }; },
    console
  };
  vm.createContext(context);
  for (const name of modules) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/' + name + '.js'), 'utf8'), context, { filename: name + '.js' });
  }
  context.Router.init(container);
  return { context, container, state, window, listeners };
}

async function flush() {
  await new Promise((resolve) => setImmediate(resolve));
}

test('invalid blog slugs and out-of-range numeric IDs render the 404 page', async () => {
  for (const route of ['/blog/missing-post', '/blog/999']) {
    const app = createRouter(route);
    await flush();
    assert.match(app.container.innerHTML, /pages\/not-found\.html/);
    assert.match(app.state.title, /404/);
    assert.equal(app.state.dynamicSchema, null);
  }
});

test('extra route segments are rejected instead of loading the parent page', async () => {
  const app = createRouter('/about/team');
  await flush();
  assert.match(app.state.title, /404/);
  assert.equal(app.state.events.at(-1).detail.route, 'about/team');
});

test('navigating from a blog post to home clears its dynamic schema', async () => {
  const app = createRouter('/blog/birinci-yazi');
  await flush();
  assert.equal(app.state.dynamicSchema.type, 'application/ld+json');
  app.context.Router.navigate('home');
  await flush();
  assert.equal(app.state.dynamicSchema, null);
  assert.equal(app.window.location.pathname, '/');
});

test('an older page response cannot replace the page requested later', async () => {
  let resolveAbout;
  const fetchImpl = (url) => url === 'pages/about.html'
    ? new Promise((resolve) => { resolveAbout = resolve; })
    : Promise.resolve({ ok: true, text: () => Promise.resolve('<main>faq page</main>') });
  const app = createRouter('/about', fetchImpl);
  app.context.Router.navigate('faq');
  await flush();
  assert.match(app.container.innerHTML, /faq page/);
  resolveAbout({ ok: true, text: () => Promise.resolve('<main>about page</main>') });
  await flush();
  assert.match(app.container.innerHTML, /faq page/);
});

test('non-success HTTP responses render a useful load error state', async () => {
  const app = createRouter('/about', () => Promise.resolve({ ok: false, text: () => Promise.resolve('') }));
  await flush();
  assert.match(app.container.innerHTML, /Sayfa yüklenemedi/);
  assert.match(app.state.title, /Sayfa yüklenemedi/);
});

test('links with queries, fragments, and file extensions are left to the browser', () => {
  const app = createRouter('/about');
  const click = app.listeners.click[0];
  for (const href of ['/about?source=nav', '/about#team', '/asset.unknown', '/st/']) {
    let prevented = false;
    const anchor = {
      target: '',
      hasAttribute() { return false; },
      getAttribute() { return href; }
    };
    click({
      defaultPrevented: false,
      button: 0,
      target: { closest() { return anchor; } },
      preventDefault() { prevented = true; }
    });
    assert.equal(prevented, false, href);
  }
});

test('initial in-page fragments survive legacy path normalization and scroll after render', async () => {
  const app = createRouter('/faq', undefined, '#fragment-target');
  await flush();
  assert.equal(app.window.location.hash, '#fragment-target');
  assert.equal(app.state.fragmentScrolled, true);
});

test('legacy page hashes migrate to path URLs and load the intended page', async () => {
  for (const hash of ['#contact', '#/contact', '#contact/']) {
    const app = createRouter('/', undefined, hash);
    await flush();
    assert.equal(app.window.location.pathname, '/contact/');
    assert.equal(app.window.location.hash, '');
    assert.match(app.container.innerHTML, /pages\/contact\.html/);
  }
  for (const hash of ['#blog/birinci-yazi', '#/blog/birinci-yazi', '#blog/birinci-yazi/']) {
    const blog = createRouter('/index.html', undefined, hash);
    await flush();
    assert.equal(blog.window.location.pathname, '/blog/birinci-yazi/');
    assert.equal(blog.window.location.hash, '');
    assert.match(blog.state.title, /Birinci yazı/);
  }
});

test('trailing slashes normalize on initial load and back/forward navigation', async () => {
  const app = createRouter('/contact');
  await flush();
  assert.equal(app.window.location.pathname, '/contact/');
  app.window.location.pathname = '/faq';
  app.listeners.popstate[0]();
  await flush();
  assert.equal(app.window.location.pathname, '/faq/');
  assert.match(app.container.innerHTML, /pages\/faq\.html/);
});

test('hash changes migrate legacy routes but preserve content fragments', async () => {
  const app = createRouter('/about');
  await flush();
  app.window.location.hash = '#/contact';
  app.listeners.hashchange[0]();
  await flush();
  assert.equal(app.window.location.pathname, '/contact/');
  app.window.location.hash = '#fragment-target';
  app.listeners.hashchange[0]();
  assert.equal(app.window.location.hash, '#fragment-target');
  assert.equal(app.state.fragmentScrolled, true);
});

test('inherited object properties are not valid product category routes', async () => {
  for (const slug of ['constructor', 'toString', '__proto__']) {
    const app = createRouter('/products/' + slug);
    await flush();
    assert.match(app.state.title, /404/);
  }
});

test('homepage prefetch and navigation share a single in-flight request', async () => {
  const requests = [];
  const app = createRouter('/', url => {
    requests.push(url);
    return Promise.resolve({ ok: true, text: () => Promise.resolve('<main>home</main>') });
  });
  app.context.Router.navigate('home');
  await flush();
  assert.deepEqual(requests, ['pages/home.html']);
  assert.equal(app.container.innerHTML, '<main>home</main>');
});

test('router disposes each mounted FAQ before replacing the page', async () => {
  const app = createRouter('/faq');
  let mounted = 0;
  let disposed = 0;
  app.context.document.getElementById = id => id === 'faq-list' ? {} : null;
  app.context.FaqList = () => { mounted++; return { destroy() { disposed++; } }; };
  await flush();
  app.context.Router.navigate('about');
  await flush();
  assert.equal(disposed, 1);
  app.context.Router.navigate('faq');
  await flush();
  app.context.Router.navigate('home');
  await flush();
  assert.equal(mounted, 2);
  assert.equal(disposed, 2);
});

test('router initialization is idempotent', async () => {
  const app = createRouter('/about');
  app.context.Router.init(app.container);
  await flush();
  for (const event of ['click', 'popstate', 'hashchange']) assert.equal(app.listeners[event].length, 1);
});
