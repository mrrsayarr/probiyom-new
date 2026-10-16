/* Shared cards. Native links are handled by the router's existing delegation. */
function CategoryGrid(container) {
  if (!container) return;
  container.innerHTML = ProductCategories.map(function (category) {
    var icon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    category.iconPaths.forEach(function (path) { icon += '<path d="' + escapeAttr(path) + '"/>'; });
    category.iconPolylines.forEach(function (points) { icon += '<polyline points="' + escapeAttr(points) + '"/>'; });
    icon += '</svg>';
    return '<div class="col">' +
      '<a href="' + escapeAttr(SiteRoutes.href('products/' + category.slug)) + '" class="category-card-link text-decoration-none">' +
        '<div class="category-card p-4 bg-white rounded-4 border border-light-subtle shadow-sm h-100 d-flex flex-column justify-content-between">' +
          '<figure class="category-media"><img' + responsiveImageAttributes(category.image, '(max-width: 767px) 100vw, 380px') + ' src="' + escapeAttr(category.image) + '" alt="' + escapeAttr(category.imageAlt) + '" loading="lazy" decoding="async"></figure>' +
          '<div>' +
            '<div class="d-flex align-items-center justify-content-between mb-3">' +
              '<div class="category-icon-box rounded-circle d-flex align-items-center justify-content-center">' + icon + '</div>' +
              '<span class="category-tagline">' + escapeHtml(category.tagline) + '</span>' +
            '</div>' +
            '<h3 class="fs-5 fw-bold text-dark mb-2 category-title">' + escapeHtml(category.label) + '</h3>' +
            '<p class="small text-muted lh-relaxed mb-3">' + escapeHtml(category.description) + '</p>' +
          '</div>' +
          '<div class="pt-3 border-top border-light-subtle d-flex align-items-center justify-content-between text-brand fw-bold small">' +
            '<span>Grubu İncele</span>' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" class="category-arrow" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
          '</div>' +
        '</div>' +
      '</a>' +
    '</div>';
  }).join('');
}
