/* ===================================================================
  Path-based Router with Dynamic SEO & Blog Sub-Routing Integration
  Routes: /, /about, /products, /products/<slug>, /contact, /faq, /blog, /blog/<slug>
  =================================================================== */

var Router = (function () {
  var mainContainer = null;
  var currentPage = null;
  var normalizeRoute = SiteRoutes.normalize;
  var buildRouteUrl = SiteRoutes.href;
  var updateSEO = PageSEO.update;
  var clearDynamicSchema = PageSEO.clear;
  var pageCache = Object.create(null);
  var pendingPages = Object.create(null);
  var routeVersion = 0;




  function init(container) {
    if (mainContainer) return;
    mainContainer = container;
    

    window.addEventListener('popstate', onRoute);
    window.addEventListener('hashchange', function () {
      if (getLegacyHashRoute() !== null) onRoute();
      else restoreHashTarget();
    });
    document.addEventListener('click', onDocumentClick, true);
    normalizeLegacyLocation();
    onRoute();
  }

  function onRoute() {
    normalizeLegacyLocation();
    routeVersion += 1;
    var route = getCurrentRoute();
    var parts = route.split('/');
    var page = parts[0];

    clearDynamicSchema();

    /* Scroll to top on navigation */
    window.scrollTo(0, 0);

    if (currentPage) {
      currentPage.destroy();
      currentPage = null;
    }

    if (!isValidRouteShape(page, parts) ||
        (page === 'products' && parts.length === 2 && !Object.prototype.hasOwnProperty.call(GroupSlugToEnum, parts[1])) ||
        (page === 'blog' && parts.length === 2 && !isValidBlogIdentifier(parts[1]))) {
      loadPage('pages/not-found.html', function () { updateNotFoundSEO(route); });
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(SiteRoutes.pages, page)) {
      loadPage('pages/not-found.html', function () { updateNotFoundSEO(route); });
      return;
    }
    // Attach interactions to the HTML already delivered by the server.
    // A legacy hash can target a different page, which still needs its template.
    var renderedRoute = mainContainer.getAttribute && mainContainer.getAttribute('data-prerender-route');
    if (renderedRoute) mainContainer.removeAttribute('data-prerender-route');
    if (renderedRoute === buildRouteUrl(route)) {
      if (page === 'home') {
        var chart = mainContainer.querySelector('[data-pathogen-chart]');
        if (chart) chart.replaceChildren();
      }
      currentPage = PageControllers.mount(page, parts[1], mainContainer);
      restoreHashTarget();
      notifyRouteChange();
      return;
    }
    loadPage(SiteRoutes.template(page, parts[1]), function () {
      currentPage = PageControllers.mount(page, parts[1], mainContainer);
    });
  }

  function isValidRouteShape(page, parts) {
    if (parts.some(function (part) { return part === ''; })) return false;
    if (page === 'products' || page === 'blog') return parts.length <= 2;
    return parts.length === 1;
  }

  function isValidBlogIdentifier(identifier) {
    if (!identifier || !blogPosts || !blogPosts.length) return false;
    if (/^\d+$/.test(identifier)) {
      var index = Number(identifier);
      return Number.isSafeInteger(index) && index < blogPosts.length;
    }
    return findBlogIndexBySlug(identifier, blogPosts) >= 0;
  }

  function updateNotFoundSEO(route) {
    updateSEO('404 - Sayfa Bulunamadı', 'Aradığınız sayfa bulunamadı.', route || '404');
    var robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute('content', 'noindex, follow');
  }

  function notifyRouteChange() {
    document.dispatchEvent(new CustomEvent('routechange', {
      detail: { route: getCurrentRoute() }
    }));
  }

  function getCurrentRoute() {
    var route = normalizeRoute(window.location.pathname.replace(/^\/+/, ''));
    return route || 'home';
  }

  function navigate(route, options) {
    var normalized = normalizeRoute(route);
    var nextUrl = buildRouteUrl(normalized);
    var replace = options && options.replace;

    if (replace) {
      window.history.replaceState({ route: normalized }, '', nextUrl);
    } else {
      window.history.pushState({ route: normalized }, '', nextUrl);
    }

    onRoute();
  }

  function onDocumentClick(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    var anchor = event.target.closest ? event.target.closest('a[href]') : null;
    if (!anchor || anchor.hasAttribute('download') || anchor.hasAttribute('data-router-ignore') ||
        (anchor.target && anchor.target !== '_self')) {
      return;
    }

    var href = anchor.getAttribute('href') || '';
    if (href.charAt(0) === '#') {
      var legacyRoute = getLegacyHashRoute(href);
      if (legacyRoute === null) return;
      event.preventDefault();
      navigate(legacyRoute);
      return;
    }

    var route = resolveRouteFromHref(href);
    if (!route) {
      return;
    }

    event.preventDefault();
    navigate(route);
  }

  function resolveRouteFromHref(href) {
    if (!href) return null;

    var url;
    try {
      url = new URL(href, window.location.origin);
    } catch (err) {
      return null;
    }

    if (url.origin !== window.location.origin) {
      return null;
    }
    if (url.search || url.hash) return null;

    var path = url.pathname.replace(/^\/+/, '');
    if (!path) return 'home';
    if (/(?:^|\/)[^/]+\.[^/]+$/.test(path)) {
      return null;
    }

    var route = normalizeRoute(path);
    // Independent documents such as /st/ must keep native browser navigation.
    return Object.prototype.hasOwnProperty.call(SiteRoutes.pages, route.split('/')[0]) ? route : null;
  }

  function getLegacyHashRoute(hash) {
    hash = hash === undefined ? window.location.hash : hash;
    if (!hash) return null;
    var value;
    try { value = decodeURIComponent(hash.slice(1)); }
    catch (err) { return null; }
    // Existing element IDs are content fragments, not legacy page routes.
    if (document.getElementById(value)) return null;
    value = value.replace(/^\//, '').replace(/\/$/, '');
    return Object.prototype.hasOwnProperty.call(SiteRoutes.pages, value.split('/')[0]) ? normalizeRoute(value) : null;
  }

  function normalizeLegacyLocation() {
    var legacyRoute = getLegacyHashRoute();
    var currentRoute = legacyRoute === null ? getCurrentRoute() : legacyRoute;
    var currentUrl = buildRouteUrl(currentRoute);
    var target = currentUrl + window.location.search + (legacyRoute === null ? window.location.hash : '');
    var currentLocation = window.location.pathname + window.location.search + window.location.hash;

    // Migrate old page hashes, while preserving genuine in-page fragments.
    if (currentLocation !== target) {
      window.history.replaceState({ route: currentRoute }, '', target);
    }
  }

  function fetchTemplate(url) {
    if (pageCache[url]) return Promise.resolve(pageCache[url]);
    if (pendingPages[url]) return pendingPages[url];
    pendingPages[url] = fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Page not found');
        return res.text();
      })
      .then(function (html) {
        pageCache[url] = html;
        delete pendingPages[url];
        return html;
      }, function (error) {
        delete pendingPages[url];
        throw error;
      });
    return pendingPages[url];
  }

  function loadPage(url, callback) {
    var requestVersion = routeVersion;
    if (pageCache[url]) {
      mainContainer.innerHTML = pageCache[url];
      if (callback) callback();
      restoreHashTarget();
      notifyRouteChange();
      return;
    }

    fetchTemplate(url)
      .then(function (html) {
        if (requestVersion !== routeVersion) return;
        mainContainer.innerHTML = html;
        if (callback) callback();
        restoreHashTarget();
        notifyRouteChange();
      })
      .catch(function () {
        if (requestVersion !== routeVersion) return;
        mainContainer.innerHTML = '<section class="page-section"><h1 class="text-brand">Sayfa yüklenemedi</h1></section>';
        updateSEO('Sayfa yüklenemedi', 'Sayfa yüklenirken bir hata oluştu.', getCurrentRoute());
        notifyRouteChange();
      });
  }

  function restoreHashTarget() {
    if (!window.location.hash) return;
    var id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch (err) {
      id = window.location.hash.slice(1);
    }
    var target = document.getElementById(id);
    if (target && typeof target.scrollIntoView === 'function') target.scrollIntoView();
  }

  return {
    init: init,
    navigate: navigate,
    getRouteHref: buildRouteUrl
  };
})();
