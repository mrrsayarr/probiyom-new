// Preview the same dist/ package and routing used by Cloudflare. No dependencies.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from './scripts/seo-worker.mjs';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
const compress = promisify(gzip);

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const check = process.argv.includes('--check');
const port = check ? 0 : Number(process.argv[2] || 7076);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.woff2': 'font/woff2'
};

if (!existsSync(path.join(root, 'seo-pages', 'manifest.json'))) {
  console.error('dist/ bulunamadı. Önce npm install ve npm run build çalıştırın.');
  process.exit(1);
}
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error('Geçerli bir port girin: node serve.mjs 7076');
  process.exit(1);
}

const env = { ASSETS: { async fetch(request) {
  try {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) return new Response('Not found', { status: 404 });
    const info = await stat(file);
    if (!info.isFile()) return new Response('Not found', { status: 404 });
    return new Response(request.method === 'HEAD' ? null : await readFile(file), {
      headers: { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'content-length': String(info.size) }
    });
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EACCES'].includes(error.code) || error instanceof URIError) {
      return new Response('Not found', { status: 404 });
    }
    throw error;
  }
} } };

const server = http.createServer(async (incoming, outgoing) => {
  if (!['GET', 'HEAD'].includes(incoming.method)) {
    outgoing.writeHead(405, { Allow: 'GET, HEAD' });
    outgoing.end();
    return;
  }
  try {
    const request = new Request(new URL(incoming.url, 'http://localhost:7076'), { method: incoming.method });
    const response = await worker.fetch(request, env);
    const headers = Object.fromEntries(response.headers);
    if (headers.location) {
      const destination = new URL(headers.location);
      headers.location = destination.pathname + destination.search;
    }
    let body = incoming.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer());
    if (body && /\bgzip\b/.test(incoming.headers['accept-encoding'] || '') &&
        /^(text\/|application\/(?:javascript|json|xml)|image\/svg)/.test(headers['content-type'] || '')) {
      body = await compress(body);
      headers['content-encoding'] = 'gzip';
      headers['content-length'] = String(body.length);
      headers.vary = 'Accept-Encoding';
    }
    outgoing.writeHead(response.status, headers);
    outgoing.end(body);
  } catch (error) {
    console.error('Önizleme hatası:', error.message);
    if (!outgoing.headersSent) outgoing.writeHead(500);
    outgoing.end('Önizleme hatası. npm run build ile yayın paketini yenileyin.');
  }
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? 'Port kullanımda. Başka port için: node serve.mjs 7077' : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', async () => {
  const base = 'http://127.0.0.1:' + server.address().port;
  if (!check) { console.log('Önizleme: ' + base + '\nKapatmak için Ctrl+C.'); return; }
  try {
    const assert = (await import('node:assert/strict')).default;
    const manifest = JSON.parse(await readFile(path.join(root, 'seo-pages', 'manifest.json'), 'utf8'));
    for (const route of manifest.routes) {
      assert.equal((await fetch(base + route)).status, 200, route);
      assert.equal((await fetch(base + route, { method: 'HEAD' })).status, 200, route);
      if (route !== '/') {
        const redirect = await fetch(base + route.slice(0, -1) + '?source=test', { redirect: 'manual' });
        assert.equal(redirect.status, 308);
        assert.equal(redirect.headers.get('location'), route + '?source=test');
      }
    }
    assert.equal((await fetch(base + '/images/logo.svg')).status, 200);
    for (const url of ['/missing/', '/seo-pages/manifest.json', '/%73eo-pages/manifest.json', '/seo%2Dpages/index.html', '/safe%2F..%2Fseo-pages/manifest.json', '/safe%3F%2F..%2Fseo-pages/manifest.json', '/serve.mjs', '/scripts/build-seo.cjs', '/%2e%2e%2fpackage.json']) {
      assert.equal((await fetch(base + url)).status, 404, url);
    }
    assert.equal((await fetch(base + '/pages/contact.html')).headers.get('x-robots-tag'), 'noindex, follow');
    assert.equal((await fetch(base + '/p%61ges/contact.html')).headers.get('x-robots-tag'), 'noindex, follow');
    const standalone = await fetch(base + '/st/index.html?source=test', { redirect: 'manual' });
    assert.equal(standalone.status, 308);
    assert.equal(standalone.headers.get('location'), '/st/?source=test');
    console.log('PASS: ' + manifest.routes.length + ' sayfa, GET/HEAD, yönlendirmeler, görseller ve özel dosya erişimi.');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { server.close(); }
});
