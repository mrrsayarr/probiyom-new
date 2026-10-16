/* ===================================================================
   Footer – Modern Corporate & Biotech Footer with Back-To-Top
   =================================================================== */

function Footer(container) {
  var year = new Date().getFullYear();

  function routeHref(route) {
    return SiteRoutes.href(route);
  }

  container.innerHTML =
    '<div class="footer py-5 text-white-50 position-relative overflow-hidden">' +
      '<div class="container position-relative z-1 footer-container">' +
        '<div class="row gy-4 gx-lg-5 justify-content-between mb-4 mb-md-5 footer-grid">' +
          
          /* 1. SÜTUN: Marka & Slogan & Rozet */
          '<div class="col-lg-4 col-md-12 text-center text-lg-start footer-column footer-brand-column">' +
            '<div class="footer-brand d-inline-flex align-items-center gap-2 mb-3 text-white">' +
              '<img src="images/logo.svg" alt="Probiyom logo" width="858" height="770">' +
              '<span class="fw-bold fs-4 tracking-tight text-white">Probiyom</span>' +
            '</div>' +
            '<p class="small lh-relaxed mb-3 text-white-50 max-w-sm">' +
              'Yüzde yüz doğal, patentli HeiQ Chrisal & VivoTech probiyotik teknolojisi ile yaşam alanlarınızda kalıcı, biyolojik ve sürdürülebilir hijyen çözümleri.' +
            '</p>' +
            '<div class="d-flex justify-content-center justify-content-lg-start">' +
              '<span class="footer-badge d-inline-flex align-items-center gap-2 px-3 py-1-5 rounded-pill small fw-semibold text-white bg-white bg-opacity-10 border border-white border-opacity-10 shadow-sm">' +
                '<span class="badge-dot rounded-circle"></span> Patentli Biyoteknoloji' +
              '</span>' +
            '</div>' +
          '</div>' +

          /* 2. SÜTUN: Hızlı Menü */
          '<div class="col-6 col-sm-4 col-lg-2 text-start footer-column footer-nav-column">' +
            '<span class="footer-label d-block text-white mb-3 text-uppercase fw-bold">Hızlı Menü</span>' +
            '<ul class="list-unstyled d-flex flex-column gap-2 small mb-0 footer-nav-list">' +
              '<li><a href="' + routeHref('home') + '" class="footer-link">Ana Sayfa</a></li>' +
              '<li><a href="' + routeHref('about') + '" class="footer-link">Hakkımızda</a></li>' +
              '<li><a href="' + routeHref('products') + '" class="footer-link">Ürünler Kataloğu</a></li>' +
              '<li><a href="' + routeHref('blog') + '" class="footer-link">Blog & Makaleler</a></li>' +
              '<li><a href="' + routeHref('faq') + '" class="footer-link">Sıkça Sorulan Sorular</a></li>' +
            '</ul>' +
          '</div>' +

          /* 3. SÜTUN: İletişim Detayları */
          '<div class="col-6 col-sm-4 col-lg-3 text-start footer-column footer-contact-column">' +
            '<span class="footer-label d-block text-white mb-3 text-uppercase fw-bold">İletişim</span>' +
            '<ul class="list-unstyled d-flex flex-column gap-2-5 small mb-0 footer-contact-list">' +
              '<li class="d-flex align-items-start gap-2">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-1 flex-shrink-0 text-mint"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>' +
                '<span>' + SiteData.address1 + ', ' + SiteData.address2 + '</span>' +
              '</li>' +
              '<li class="d-flex align-items-center gap-2">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 text-mint"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.79 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>' +
                '<a href="tel:' + SiteData.phone + '" class="footer-link">' + SiteData.phone + '</a>' +
              '</li>' +
              '<li class="d-flex align-items-center gap-2">' +
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0 text-mint"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>' +
                '<a href="mailto:' + SiteData.email + '" class="footer-link">' + SiteData.email + '</a>' +
              '</li>' +
            '</ul>' +
          '</div>' +

          /* 4. SÜTUN: Sosyal Medya İkon Düğmeleri */
          '<div class="col-12 col-sm-4 col-lg-3 text-center text-sm-start footer-column footer-social-column">' +
            '<span class="footer-label d-block text-white mb-3 text-uppercase fw-bold">Bizi Takip Edin</span>' +
            '<p class="small text-white-50 mb-3">Sosyal medyada güncel biyoteknoloji haberlerimizi kaçırmayın.</p>' +
            '<div class="footer-social-icons d-flex align-items-center justify-content-center justify-content-sm-start gap-2 me-n1">' +
              '<a href="' + escapeAttr(SiteData.trendyol) + '" target="_blank" rel="noopener noreferrer" aria-label="Trendyol mağazamız" title="Trendyol mağazamız" class="social-icon-btn trendyol-social-link">' + SocialIcons.trendyol + '</a>' +
              '<a href="' + escapeAttr(SiteData.instagram) + '" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram" class="social-icon-btn">' + SocialIcons.instagram + '</a>' +
              '<a href="' + escapeAttr(SiteData.x) + '" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" title="X (Twitter)" class="social-icon-btn">' + SocialIcons.x + '</a>' +
              '<a href="' + escapeAttr(SiteData.linkedin) + '" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn" class="social-icon-btn">' + SocialIcons.linkedin + '</a>' +
              '<a href="' + escapeAttr(SiteData.youtube) + '" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube" class="social-icon-btn">' + SocialIcons.youtube + '</a>' +
            '</div>' +
          '</div>' +

        '</div>' +

        /* Telif Hakkı & Yukarı Çık Alanı */
        '<div class="footer-copy mt-4 pt-4 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 border-top border-white border-opacity-10">' +
          '<small class="small text-white-50 m-0">&copy; ' + year + ' Probiyom. Tüm hakları saklıdır.</small>' +
          '<button type="button" class="footer-top-btn text-white-50 border-0 bg-transparent d-inline-flex align-items-center gap-2 small transition-all" id="footer-scroll-top">' +
            '<span>Yukarı Çık</span>' +
            '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>' +
          '</button>' +
        '</div>' +

      '</div>' +
    '</div>';

  /* Sayfayı Yumuşakça En Tepeye Kaydıran Buton Dinleyicisi */
  var scrollTopBtn = container.querySelector('#footer-scroll-top');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function () {
      var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }
}
