const MANIFEST_PATH = '/seo-pages/manifest.json';

function response404(request, html) {
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'x-robots-tag': 'noindex, follow'
  });
  if (request.method === 'HEAD') return new Response(null, { status: 404, headers });
  return new Response(html, { status: 404, headers });
}

function assetRequest(request, path, method = request.method) {
  const url = new URL(request.url);
  url.pathname = path;
  url.search = '';
  return new Request(url, { method, headers: request.headers });
}

async function loadManifest(request, env) {
  const response = await env.ASSETS.fetch(assetRequest(request, MANIFEST_PATH, 'GET'));
  if (!response.ok) throw new Error(`SEO manifest returned ${response.status}`);
  const manifest = await response.json();
  if (!Array.isArray(manifest.routes) || !manifest.aliases || typeof manifest.aliases !== 'object') {
    throw new Error('SEO manifest has an invalid shape');
  }
  return manifest;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Never expose the generated document store as a public URL namespace.
    if (path === '/404.html' || path === '/seo-pages' || path.startsWith('/seo-pages/')) {
      const notFound = await env.ASSETS.fetch(assetRequest(request, '/seo-pages/404.html', 'GET'));
      return response404(request, await notFound.text());
    }

    if (path === '/index.html') {
      url.pathname = '/';
      return Response.redirect(url, 308);
    }

    // All page URLs use one trailing slash, including the standalone document.
    const pagePath = path.replace(/\/+$/, '') + '/';
    if (pagePath === '/st/') {
      if (path !== pagePath) {
        url.pathname = pagePath;
        return Response.redirect(url, 308);
      }
      return env.ASSETS.fetch(assetRequest(request, '/st/index.html'));
    }

    const manifest = await loadManifest(request, env);
    const canonical = Object.hasOwn(manifest.aliases, pagePath) ? manifest.aliases[pagePath] : null;
    if (canonical) {
      url.pathname = canonical;
      return Response.redirect(url, 308);
    }
    if (manifest.routes.includes(pagePath) && path !== pagePath) {
      url.pathname = pagePath;
      return Response.redirect(url, 308);
    }

    // Preserve ordinary assets (and their response headers/cache behavior).
    const asset = await env.ASSETS.fetch(request);
    if (asset.ok) return asset;

    if (manifest.routes.includes(path)) {
      const generatedPath = path === '/' ? '/seo-pages/index.html' : `/seo-pages${path}index.html`;
      return env.ASSETS.fetch(assetRequest(request, generatedPath));
    }

    const notFound = await env.ASSETS.fetch(assetRequest(request, '/seo-pages/404.html', 'GET'));
    const html = await notFound.text();
    return response404(request, html);
  }
};
