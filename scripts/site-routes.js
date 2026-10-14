/* Shared URL contract. Register each static template in one place. */
var SiteRoutes = (function () {
  function normalizeRoute(route) {
    var normalized = (route || 'home').replace(/^\/+/, '').replace(/\/+$/, '');
    return normalized === 'index.html' ? 'home' : (normalized || 'home');
  }

  function buildRouteUrl(route) {
    var normalized = normalizeRoute(route);
    if (normalized === 'home') {
      return '/';
    }

    return '/' + normalized + '/';
  }


  return {
    normalize: normalizeRoute,
    href: buildRouteUrl,
    pages: {
      home: 'pages/home.html', about: 'pages/about.html',
      products: 'pages/products.html', contact: 'pages/contact.html',
      faq: 'pages/faq.html', blog: 'pages/blog.html'
    },
    template: function (page, parameter) {
      return page === 'products' && parameter ? 'pages/product-group.html' : this.pages[page];
    }
  };
})();
