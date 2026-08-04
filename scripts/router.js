/* ===================================================================
  Path-based Router with Dynamic SEO & Blog Sub-Routing Integration
  Routes: /, /about, /products, /products/<slug>, /contact, /faq, /blog, /blog/<slug>
  =================================================================== */

var Router = (function () {
  var mainContainer = null;
  var currentSlider = null;
  var pageCache = {};

  function init(container) {
    mainContainer = container;
    
    // Sitenin ilk açılış gecikmesini önlemek için home.html şablonunu arka planda ön-çekim (prefetch) yapıyoruz
    fetch('pages/home.html')
      .then(function (res) { return res.text(); })
      .then(function (html) { pageCache['pages/home.html'] = html; })
      .catch(function () {});

    window.addEventListener('popstate', onRoute);
    document.addEventListener('click', onDocumentClick, true);
    normalizeLegacyLocation();
    onRoute();
  }

  function onRoute() {
    var route = getCurrentRoute();
    var parts = route.split('/');
    var page = parts[0];

    /* Scroll to top on navigation */
    window.scrollTo(0, 0);

    /* Destroy previous slider if any */
    if (currentSlider && currentSlider.destroy) {
      currentSlider.destroy();
      currentSlider = null;
    }

    switch (page) {
      case 'home':
        loadPage('pages/home.html', initHomePage);
        break;
      case 'about':
        loadPage('pages/about.html', initAboutPage);
        break;
      case 'products':
        if (parts.length > 1 && parts[1]) {
          loadPage('pages/product-group.html', function () {
            initProductGroupPage(parts[1]);
          });
        } else {
          loadPage('pages/products.html', initProductsPage);
        }
        break;
      case 'contact':
        loadPage('pages/contact.html', initContactPage);
        break;
      case 'faq':
        loadPage('pages/faq.html', initFaqPage);
        break;
      case 'blog':
        /* DÜZELTİLDİ: blog/0 veya blog/1 gibi spesifik blog linklerini yakalar */
        if (parts.length > 1 && parts[1] !== undefined && parts[1] !== '') {
          loadPage('pages/blog.html', function () {
            initBlogPage(parts[1]);
          });
        } else {
          loadPage('pages/blog.html', function () {
            initBlogPage();
          });
        }
        break;
      default:
        loadPage('pages/not-found.html', function () {
          updateSEO('Sayfa Bulunamadı - 404', 'Aradığınız sayfa bulunamadı.', '404');
        });
        break;
    }
  }

  function getCurrentRoute() {
    var route = normalizeRoute(window.location.pathname.replace(/^\/+/, ''));
    return route || 'home';
  }

  function normalizeRoute(route) {
    var normalized = (route || 'home').replace(/^\/+/, '').replace(/\/?$/, '');
    return normalized === 'index.html' ? 'home' : (normalized || 'home');
  }

  function buildRouteUrl(route) {
    var normalized = normalizeRoute(route);
    if (normalized === 'home') {
      return '/';
    }

    return '/' + normalized;
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
    if (!anchor) {
      return;
    }

    var route = resolveRouteFromHref(anchor.getAttribute('href') || '');
    if (!route) {
      return;
    }

    event.preventDefault();
    navigate(route);
  }

  function resolveRouteFromHref(href) {
    if (!href) return null;

    if (/^(https?:)?\/\//i.test(href)) {
      try {
        var externalUrl = new URL(href, window.location.origin);
        if (externalUrl.origin !== window.location.origin) return null;
        href = externalUrl.pathname;
      } catch (err) {
        return null;
      }
    }

    if (href.charAt(0) === '?') {
      return null;
    }

    var url;
    try {
      url = new URL(href, window.location.origin);
    } catch (err) {
      return null;
    }

    if (url.origin !== window.location.origin) {
      return null;
    }

    var path = url.pathname.replace(/^\/+/, '');
    if (!path) return 'home';
    if (/\.(html?|css|js|png|jpe?g|webp|svg|ico)$/i.test(path)) {
      return null;
    }

    return normalizeRoute(path);
  }

  function normalizeLegacyLocation() {
    var currentRoute = getCurrentRoute();
    var currentUrl = buildRouteUrl(currentRoute);
    var target = currentUrl + window.location.search;
    var currentLocation = window.location.pathname + window.location.search;

    // Adres çubuğunda HASH görürse (#home, #about vb.) onu her zaman siler.
    // Böylece tarayıcı restorasyonu ya da eski bir sayfadan kalan hash kalıcı kalmaz;
    // URL her zaman temiz (hash'siz) gerçek yol olur.
    if (currentLocation !== target || window.location.hash) {
      window.history.replaceState({ route: currentRoute }, '', target);
    }
  }

  function loadPage(url, callback) {
    if (pageCache[url]) {
      mainContainer.innerHTML = pageCache[url];
      if (callback) callback();
      return;
    }

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Page not found');
        return res.text();
      })
      .then(function (html) {
        pageCache[url] = html;
        mainContainer.innerHTML = html;
        if (callback) callback();
      })
      .catch(function () {
        mainContainer.innerHTML = '<section class="page-section"><h1 class="text-brand">Sayfa yüklenemedi</h1></section>';
      });
  }

  /* ===================================================================
     Dinamik SEO, Meta Etiketleri ve Şema (Schema.org) Enjektörü
     =================================================================== */

  function updateSEO(title, description, path) {
    // 1. Tarayıcı Başlığı
    document.title = title ? title + " | Probiyom" : "Probiyom - Probiyotik & Sinbiyotik Teknolojisi";

    // 2. Meta Description (Google Arama Özeti)
    var metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    if (description) {
      metaDesc.setAttribute('content', description);
    }

    // 3. Canonical Link (Dizinleme Kararlılığı)
    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    var cleanPath = normalizeRoute(path || '');
    canonical.setAttribute('href', window.location.origin + buildRouteUrl(cleanPath));

    // 4. OpenGraph Sosyal Medya Kartları
    updateMetaTag('og:title', title ? title + " | Probiyom" : "Probiyom");
    updateMetaTag('og:description', description || '');
    updateMetaTag('og:url', window.location.origin + buildRouteUrl(cleanPath));
  }

  function updateMetaTag(property, content) {
    var tag = document.querySelector('meta[property="' + property + '"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  }

  function injectProductSchema(groupTitle, slug, description) {
    var oldSchema = document.getElementById('dynamic-schema');
    if (oldSchema && oldSchema.parentNode) {
      oldSchema.parentNode.removeChild(oldSchema);
    }

    var schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": groupTitle + " | Probiyom Biyoteknoloji",
      "description": description,
      "url": window.location.origin + buildRouteUrl('products/' + slug)
    };

    var script = document.createElement('script');
    script.id = 'dynamic-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  /* ---- Page initializers ---- */

  function initHomePage() {
    updateSEO(
      'Probiyotik & Sinbiyotik Temizlik Teknolojisi',
      'Yüzde yüz doğal, patentli HeiQ VivoTech probiyotik ve sinbiyotik temizlik teknolojisi ile yaşam alanlarınızda 72 saate kadar kalıcı ve sürdürülebilir hijyen çözümleri.',
      'home'
    );

    var sliders = [];
    var homeSliderEl = document.getElementById('home-slider');
    if (homeSliderEl) {
      sliders.push(ImageSlider(homeSliderEl, homeSlides, SLIDER_DURATION_MS));
    }
    var productsSliderEl = document.getElementById('products-slider');
    if (productsSliderEl) {
      sliders.push(ImageSlider(productsSliderEl, productSlides, SLIDER_DURATION_MS));
    }
    currentSlider = {
      destroy: function () {
        sliders.forEach(function (s) { if (s && s.destroy) s.destroy(); });
      }
    };
  }

  function initProductsPage() {
    updateSEO(
      'Ürün Gruplarımız',
      'Profesyonel temizlikten ev bakımına, hayvancılıktan kişisel bakıma kadar HeiQ Chrisal patentli probiyotik ve sinbiyotik hijyen ürünlerimizi keşfedin.',
      'products'
    );

    var sliderEl = document.getElementById('products-slider');
    if (sliderEl) {
      currentSlider = ImageSlider(sliderEl, productSlides, SLIDER_DURATION_MS);
    }
  }

  function initProductGroupPage(slug) {
    var groupEnum = GroupSlugToEnum[slug];
    if (groupEnum === undefined) {
      mainContainer.innerHTML = pageCache['pages/not-found.html'] ||
        '<section class="page-section"><h1 class="text-brand">404</h1><p>Ürün grubu bulunamadı.</p></section>';
      updateSEO('404 - Sayfa Bulunamadı', 'Aradığınız ürün grubu bulunamadı.', '#404');
      return;
    }

    var groupTitle = ProductGroupLabels[groupEnum] || 'Ürün Grubu';
    var groupIntro = ProductGroupIntroText[groupEnum];
    var groupProducts = products.filter(function (p) {
      return p.group === groupEnum;
    });

    var groupSeoDesc = (groupIntro && groupIntro.paragraph)
      ? groupIntro.paragraph
      : groupTitle + ' kategorisindeki patentli HeiQ Synbio probiyotik ve sinbiyotik temizlik ve bakım ürünlerimizi inceleyin.';

    updateSEO(groupTitle, groupSeoDesc, 'products/' + slug);
    injectProductSchema(groupTitle, slug, groupSeoDesc);

    /* Build header */
    var headerEl = document.getElementById('group-header');
    if (headerEl) {
      var headerHtml = '<h1 class="text-brand mb-4 fw-bold fs-2">' + escapeHtml(groupTitle) + '</h1>';

      if (groupIntro) {
        var introTextHtml =
          '<div class="group-intro-text">' +
            '<p class="heading fs-5 fw-bold mb-3">' + escapeHtml(groupIntro.heading) + '</p>' +
            '<ul class="mb-3">';

        for (var i = 0; i < groupIntro.bullets.length; i++) {
          introTextHtml += '<li>' + escapeHtml(groupIntro.bullets[i]) + '</li>';
        }

        introTextHtml += '</ul>' +
          '<p class="mb-3">' + escapeHtml(groupIntro.paragraph) + '</p>';

        if (groupIntro.warning) {
          introTextHtml += '<p class="warning fw-semibold text-danger mb-0">' + escapeHtml(groupIntro.warning) + '</p>';
        }

        introTextHtml += '</div>';

        if (groupIntro.images && groupIntro.images.length > 0) {
          headerHtml +=
            '<div class="row g-4 align-items-center mt-2">' +
              '<div class="col-12 col-lg-7">' + introTextHtml + '</div>' +
              '<div class="col-12 col-lg-5">' +
                '<div id="group-intro-slider"></div>' +
              '</div>' +
            '</div>';
        } else if (groupIntro.imageDir) {
          var imgAlt = groupIntro.imageName || groupTitle;
          var introImageHtml =
            '<div class="group-intro-image">' +
              '<div class="group-intro-image-inner">' +
                '<img src="' + escapeAttr(groupIntro.imageDir) + '" alt="' + escapeAttr(imgAlt) + '">' +
              '</div>' +
            '</div>';

          headerHtml +=
            '<div class="row g-4 align-items-start mt-2">' +
              '<div class="col-12 col-lg-7">' + introTextHtml + '</div>' +
              '<div class="col-12 col-lg-5">' + introImageHtml + '</div>' +
            '</div>';
        } else {
          headerHtml += introTextHtml;
        }
      }

      headerEl.innerHTML = headerHtml;

      if (groupIntro && groupIntro.images && groupIntro.images.length > 0) {
        var groupSliderEl = document.getElementById('group-intro-slider');
        if (groupSliderEl && typeof ImageSlider === 'function') {
          var groupSlides = groupIntro.images.map(function (src, idx) {
            return {
              src: src,
              alt: groupTitle + ' Tanıtım Slaytı ' + (idx + 1),
              title: ''
            };
          });
          ImageSlider(groupSliderEl, groupSlides, 4000);
        }
      }
    }

    /* Build product grid */
    var productsEl = document.getElementById('group-products');
    if (productsEl) {
      ProductGrid(productsEl, groupProducts);
    }
  }

  function initAboutPage() {
    updateSEO(
      'Hakkımızda',
      'Probiyom olarak HeiQ Chrisal iş birliğiyle yüzde yüz doğal ve sürdürülebilir probiyotik hijyen teknolojilerini yaşam alanlarınıza taşıyoruz.',
      'about'
    );

    var addressEl = document.getElementById('about-address');
    if (addressEl) {
      addressEl.innerHTML = SiteData.address1 + '<br>' + SiteData.address2;
    }

    var phoneEl = document.getElementById('about-phone');
    if (phoneEl) {
      phoneEl.href = 'tel:' + SiteData.phone;
      phoneEl.textContent = SiteData.phone;
    }

    var emailEl = document.getElementById('about-email');
    if (emailEl) {
      emailEl.href = 'mailto:' + SiteData.email;
      emailEl.textContent = SiteData.email;
    }

    var socialEl = document.getElementById('about-social');
    if (socialEl) {
      socialEl.innerHTML =
        '<a href="' + SiteData.instagram + '" target="_blank" rel="noopener">Instagram</a>' +
        ' &middot; ' +
        '<a href="' + SiteData.x + '" target="_blank" rel="noopener">Twitter / X</a>';
    }
  }

  function initFaqPage() {
    updateSEO(
      'Sıkça Sorulan Sorular',
      'Probiyotik ve sinbiyotik hijyen teknolojisi, kullanım alanları, 72 saat süren etkisi ve ürünlerimiz hakkında merak ettiğiniz tüm yanıtlar.',
      'faq'
    );

    var listEl = document.getElementById('faq-list');
    if (listEl) {
      FaqList(listEl, faqs);
    }
  }

      /* GÜNCELLENDİ: Blog Sayfası Başlatıcısı (Slug + Geriye Dönük Sayısal Dizin Desteği)
        /blog -> liste | /blog/<slug> -> tekil yazı */
  function initBlogPage(postParam) {
    var listEl = document.getElementById('blog-list');

    var hasParam = postParam !== undefined && postParam !== null && postParam !== '';
    var isNumeric = hasParam && /^\d+$/.test(String(postParam));

    if (hasParam && blogPosts && blogPosts.length > 0) {
      var post = null;
      var slug = null;

      if (isNumeric) {
        // Geriye dönük uyumluluk: eski sayısal linkler hâlâ çalışır
        var idx = parseInt(postParam, 10);
        if (isNaN(idx) || idx < 0 || idx >= blogPosts.length) idx = 0;
        post = blogPosts[idx];
        slug = blogSlug(post);
      } else {
        // Yeni slug tabanlı link: /blog/<slug>
        var found = findBlogIndexBySlug(postParam, blogPosts);
        if (found >= 0) {
          post = blogPosts[found];
          slug = postParam;
        }
      }

      if (post) {
        var snippet = post.text ? post.text.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 150) + '...' : '';

        // Bu spesifik makaleye özel SEO Başlığı ve Özeti (canonical slug ile)
        updateSEO(post.title, snippet, 'blog/' + slug);

        if (listEl && typeof BlogList === 'function') {
          // BlogList identifier'ı (sayı ya da slug) kendisi çözer
          BlogList(listEl, blogPosts, isNumeric ? parseInt(postParam, 10) : slug);
        }
        return;
      }
    }

    // Genel Blog Listesi Görünümü (/blog) ya da bulunamayan slug
    updateSEO(
      'Blog & Bilimsel Makaleler',
      'Probiyotik teknoloji, mikrobiyom sağlığı, sürdürülebilirlik ve biyolojik hijyen hakkında en güncel makaleler ve bilimsel yayınlar.',
      'blog'
    );

    if (listEl && typeof BlogList === 'function') {
      BlogList(listEl, blogPosts);
    }
  }

  function initContactPage() {
    updateSEO(
      'İletişim',
      'Probiyom Ekibi ile iletişime geçin. Teknik bilgi, ürün talepleri ve iş birliği süreçleri için bize ulaşabilirsiniz.',
      'contact'
    );

    /* Fill contact info */
    var addressEl = document.getElementById('contact-address');
    if (addressEl) {
      addressEl.innerHTML = SiteData.address1 + '<br>' + SiteData.address2;
    }

    var phoneEl = document.getElementById('contact-phone');
    if (phoneEl) {
      phoneEl.href = 'tel:' + SiteData.phone;
      phoneEl.textContent = SiteData.phone;
    }

    var emailEl = document.getElementById('contact-email');
    if (emailEl) {
      emailEl.href = 'mailto:' + SiteData.email;
      emailEl.textContent = SiteData.email;
    }

    var instagramEl = document.getElementById('contact-instagram');
    if (instagramEl) {
      instagramEl.href = SiteData.instagram;
    }

    var xEl = document.getElementById('contact-x');
    if (xEl) {
      xEl.href = SiteData.x;
    }

    var linkedinEl = document.getElementById('contact-linkedin');
    if (linkedinEl) {
      linkedinEl.href = SiteData.linkedin;
    }

    var youtubeEl = document.getElementById('contact-youtube');
    if (youtubeEl) {
      youtubeEl.href = SiteData.youtube;
    }

    /* Map */
    var mapEl = document.getElementById('contact-map');
    if (mapEl) {
      ContactMap(mapEl, SiteData.lon, SiteData.lat, 15);
    }

    /* Contact form */
    var formEl = document.getElementById('contact-form-container');
    if (formEl) {
      ContactForm(formEl);
    }
  }

  return {
    init: init,
    navigate: navigate,
    getRouteHref: buildRouteUrl
  };
})();