import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../scripts/seo-worker.mjs';

const manifest = {
  routes: ['/', '/about', '/blog/example'],
  aliases: { '/blog/0': '/blog/example' }
};
const documents = new Map([
  ['/seo-pages/manifest.json', JSON.stringify(manifest)],
  ['/seo-pages/index.html', '<html><head><title>Home | Probiyom</title><link rel="canonical" href="https://www.probiyom.com/"></head><body>Home</body></html>'],
  ['/seo-pages/about/index.html', '<html><head><title>About | Probiyom</title><meta name="description" content="About page"></head><body>About</body></html>'],
  ['/seo-pages/blog/example/index.html', '<html><head><title>Example | Probiyom</title></head><body>Article</body></html>'],
  ['/seo-pages/404.html', '<html><head><meta name="robots" content="noindex, follow"></head><body>Not found</body></html>'],
  ['/images/logo.svg', '<svg></svg>'],
  ['/st/index.html', '<html><body>Standalone demo</body></html>']
]);

function envFor(fetchLog = []) {
  return { ASSETS: { async fetch(resource) {
    const url = resource instanceof Request || resource instanceof URL ? new URL(resource.url ?? resource) : new URL(resource, 'https://site.test');
    fetchLog.push(url.pathname);
    const body = documents.get(url.pathname);
    return body === undefined
      ? new Response('missing', { status: 404 })
      : new Response(resource instanceof Request && resource.method === 'HEAD' ? null : body, { headers: { 'content-type': url.pathname.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8' } });
  } } };
}

test('serves generated clean routes as HTML with their SEO head', async () => {
  const response = await worker.fetch(new Request('https://site.test/about'), envFor());
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(html, /<title>About \| Probiyom<\/title>/);
  assert.match(html, /name="description"/);
});

test('maps the public root to the generated root document', async () => {
  const response = await worker.fetch(new Request('https://site.test/'), envFor());
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<title>Home \| Probiyom<\/title>/);
});

test('preserves ordinary static asset responses', async () => {
  const response = await worker.fetch(new Request('https://site.test/images/logo.svg'), envFor());
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<svg/);
});

test('returns a real noindex 404 for unknown routes', async () => {
  const response = await worker.fetch(new Request('https://site.test/missing'), envFor());
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
  assert.match(await response.text(), /noindex, follow/);
});

test('the public 404 document also returns HTTP 404', async () => {
  const response = await worker.fetch(new Request('https://site.test/404.html'), envFor());
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
});

test('redirects trailing slashes to the clean URL and preserves query strings', async () => {
  const response = await worker.fetch(new Request('https://site.test/about/?ref=mail'), envFor());
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), 'https://site.test/about?ref=mail');
});

test('redirects numeric blog aliases to their canonical slug', async () => {
  const response = await worker.fetch(new Request('https://site.test/blog/0?ref=old'), envFor());
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), 'https://site.test/blog/example?ref=old');
});

test('does not expose generated documents through the seo-pages namespace', async () => {
  const calls = [];
  const response = await worker.fetch(new Request('https://site.test/seo-pages/about/index.html'), envFor(calls));
  assert.equal(response.status, 404);
  assert.match(await response.text(), /noindex/);
  assert.equal(calls.includes('/seo-pages/about/index.html'), false);
});

test('serves generated routes to HEAD requests without fetching the manifest as HEAD', async () => {
  const calls = [];
  const response = await worker.fetch(new Request('https://site.test/about', { method: 'HEAD' }), envFor(calls));
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  assert.equal(calls.includes('/seo-pages/manifest.json'), true);
});

test('returns a bodyless HEAD 404 with noindex headers', async () => {
  const response = await worker.fetch(new Request('https://site.test/missing', { method: 'HEAD' }), envFor());
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
  assert.equal(await response.text(), '');
});

test('keeps the standalone directory index reachable and redirects /index.html', async () => {
  const env = envFor();
  const slashRoute = await worker.fetch(new Request('https://site.test/st/'), env);
  const cleanRoute = await worker.fetch(new Request('https://site.test/st'), env);
  const homeAlias = await worker.fetch(new Request('https://site.test/index.html?x=1'), env);
  assert.equal(slashRoute.status, 200);
  assert.equal(cleanRoute.status, 200);
  assert.equal(homeAlias.status, 308);
  assert.equal(homeAlias.headers.get('location'), 'https://site.test/?x=1');
});

test('does not treat inherited object names as aliases', async () => {
  const response = await worker.fetch(new Request('https://site.test/toString'), envFor());
  assert.equal(response.status, 404);
});
