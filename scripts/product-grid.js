/* ===================================================================
   ProductGrid – renders a grid of product cards for a product group
   =================================================================== */

function ProductGrid(container, groupProducts) {
  // GÜVENLİK KONTROLÜ: Router yüklenirken oluşabilecek çökme hatalarını önler.
  if (!container) {
    console.warn("ProductGrid konteyneri DOM üzerinde bulunamadı.");
    return;
  }

  if (!groupProducts || groupProducts.length === 0) {
    container.innerHTML = '<div class="empty-state">Bu grupta henüz ürün eklenmedi.</div>';
    return;
  }

  var html = '<div class="grid-product-cards">';
  for (var i = 0; i < groupProducts.length; i++) {
    var p = groupProducts[i];
    var badgeClass = p.isAvailable ? 'available' : 'upcoming';
    var badgeText = p.isAvailable ? 'Mevcut' : 'Yakında';

    var bulletsHtml = '';
    if (p.bullets && p.bullets.length > 0) {
      bulletsHtml = '<ul class="product-bullets">';
      for (var j = 0; j < p.bullets.length; j++) {
        bulletsHtml += '<li>' + escapeHtml(p.bullets[j]) + '</li>';
      }
      bulletsHtml += '</ul>';
    }

    var imageHtml = '';
    if (p.imageDir) {
      var src = p.imageDir.indexOf('/') === 0 ? p.imageDir : p.imageDir;
      imageHtml = '<div class="product-card-image overflow-hidden position-relative">' +
                    '<img src="' + src + '" alt="' + escapeAttr(p.name) + '" class="w-100 h-100 transition-all">' +
                  '</div>';
    }

    html +=
      '<article class="product-card bg-white">' +
        '<div class="product-card-header d-flex align-items-start justify-content-between gap-3">' +
          '<h3 class="fs-5 fw-bold text-brand m-0">' + escapeHtml(p.name) + '</h3>' +
          '<span class="product-badge px-3 py-1 rounded-pill small fw-semibold ' + badgeClass + '">' + badgeText + '</span>' +
        '</div>' +
        '<p class="product-description">' + escapeHtml(p.description) + '</p>' +
        bulletsHtml +
        imageHtml +
      '</article>';
  }
  html += '</div>';

  container.innerHTML = html;
}