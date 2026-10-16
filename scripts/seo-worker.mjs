const MANIFEST_PATH = '/seo-pages/manifest.json';

function normalizedAssetPath(pathname) {
  try {
    const segments = [];
    for (const segment of decodeURIComponent(pathname).replaceAll('\\', '/').split('/')) {
      if (segment === '..') segments.pop();
      else if (segment && segment !== '.') segments.push(segment);
    }
    return ('/' + segments.join('/')).toLowerCase();
  } catch { return '/404.html'; }
}

function assetResponse(response, pathname) {
  const headers = new Headers(response.headers);
  const immutable = /^\/(?:scripts|styles)\/site\.[a-f0-9]{12}\./.test(pathname) ||
    /^\/images\/optimized\/.+-[a-f0-9]{8}-\d+\.webp$/.test(pathname);
  headers.set('Cache-Control', immutable ? 'public, max-age=31536000, immutable' :
    /\.(?:html|txt|xml|json)$/.test(pathname) || pathname.endsWith('/') ? 'no-cache' : 'public, max-age=604800');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  if (/^\/pages\/.*\.html$/.test(normalizedAssetPath(pathname))) headers.set('X-Robots-Tag', 'noindex, follow');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

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

    // Asset providers decode paths; apply the private-path guard to that same form.
    const decodedPath = normalizedAssetPath(path);
    // Never expose the generated document store, including percent-encoded aliases.
    if (decodedPath === '/404.html' || decodedPath === '/seo-pages' || decodedPath.startsWith('/seo-pages/')) {
      const notFound = await env.ASSETS.fetch(assetRequest(request, '/seo-pages/404.html', 'GET'));
      return response404(request, await notFound.text());
    }

    if (path === '/index.html' || path === '/st/index.html') {
      url.pathname = path === '/st/index.html' ? '/st/' : '/';
      return Response.redirect(url, 308);
    }

    // Ordinary files need no page manifest lookup or routing work.
    if (/^\/(?:images|styles|scripts|data)\//.test(path)) {
      const response = await env.ASSETS.fetch(request);
      if (response.ok) return assetResponse(response, path);
    }

    // All page URLs use one trailing slash, including the standalone document.
    const pagePath = path.replace(/\/+$/, '') + '/';
    if (pagePath === '/st/') {
      if (path !== pagePath) {
        url.pathname = pagePath;
        return Response.redirect(url, 308);
      }
      return assetResponse(await env.ASSETS.fetch(assetRequest(request, '/st/index.html')), path);
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
    if (asset.ok) return assetResponse(asset, path);

    if (manifest.routes.includes(path)) {
      const generatedPath = path === '/' ? '/seo-pages/index.html' : `/seo-pages${path}index.html`;
      return assetResponse(await env.ASSETS.fetch(assetRequest(request, generatedPath)), path);
    }

    const notFound = await env.ASSETS.fetch(assetRequest(request, '/seo-pages/404.html', 'GET'));
    const html = await notFound.text();
    return response404(request, html);
  }
};
