/* ===================================================================
  Path-based Router with Dynamic SEO & Blog Sub-Routing Integration
  Routes: /, /about, /products, /products/<slug>, /contact, /faq, /blog, /blog/<slug>
  =================================================================== */

var Router = (function () {
  var mainContainer = null;
  var currentSlider = null;
  var pageCache = {};
  var routeVersion = 0;
  var currentMap = null;



  function init(container) {
    mainContainer = container;
    
    // Sitenin ilk aÃ§Ä±lÄ±ÅŸ gecikmesini Ã¶nlemek iÃ§in home.html ÅŸablonunu arka planda Ã¶n-Ã§ekim (prefetch) yapÄ±yoruz
    fetch('pages/home.html')
      .then(function (res) {
        if (!res.ok) throw new Error('Homepage prefetch failed');
        return res.text();
      })
      .then(function (html) { pageCache['pages/home.html'] = html; })
      .catch(function () {});

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

    /* Destroy previous slider if any */
    if (currentSlider && currentSlider.destroy) {
      currentSlider.destroy();
      currentSlider = null;
    }
    if (currentMap && currentMap.destroy) {
      currentMap.destroy();
      currentMap = null;
    }

    if (!isValidRouteShape(page, parts) ||
        (page === 'products' && parts.length === 2 && !Object.prototype.hasOwnProperty.call(GroupSlugToEnum, parts[1])) ||
        (page === 'blog' && parts.length === 2 && !isValidBlogIdentifier(parts[1]))) {
      loadPage('pages/not-found.html', function () { updateNotFoundSEO(route); });
      return;
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
        /* DÃœZELTÄ°LDÄ°: blog/0 veya blog/1 gibi spesifik blog linklerini yakalar */
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
  }

  function notifyRouteChange() {
    document.dispatchEvent(new CustomEvent('routechange', {
      detail: { route: getCurrentRoute() }
    }));
  }

  function clearDynamicSchema() {
    var oldSchema = document.getElementById('dynamic-schema');
    if (oldSchema && oldSchema.parentNode) oldSchema.parentNode.removeChild(oldSchema);
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

    return normalizeRoute(path);
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
    return /^(home|about|contact|faq|products|blog)(?:\/.*)?$/.test(value) ? normalizeRoute(value) : null;
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

  function loadPage(url, callback) {
    var requestVersion = routeVersion;
    if (pageCache[url]) {
      mainContainer.innerHTML = pageCache[url];
      if (callback) callback();
      restoreHashTarget();
      notifyRouteChange();
      return;
    }

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Page not found');
        return res.text();
      })
      .then(function (html) {
        pageCache[url] = html;
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

  /* ===================================================================
     Dinamik SEO, Meta Etiketleri ve Şema (Schema.org) Enjektörleri
     =================================================================== */

  function updateSEO(title, description, path) {
    // 1. Title Tag
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
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:site_name', 'Probiyom');
    updateMetaTag('og:locale', 'tr_TR');
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

  function injectSchema(schema) {
    clearDynamicSchema();

    var script = document.createElement('script');
    script.id = 'dynamic-schema';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  function injectProductSchema(groupTitle, slug, description) {
    var schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": groupTitle + " | Probiyom Biyoteknoloji",
      "description": description,
      "url": window.location.origin + buildRouteUrl('products/' + slug),
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": []
      }
    };
    injectSchema(schema);
  }

  function injectBlogPostSchema(post, slug) {
    var schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.text ? post.text.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) : '',
      "image": post.imageDir ? window.location.origin + '/' + post.imageDir : window.location.origin + '/images/homepage_sliders/hp_1.webp',
      "datePublished": "2024-01-01",
      "dateModified": "2025-01-15",
      "author": {
        "@type": "Organization",
        "name": "Probiyom",
        "url": "https://www.probiyom.com/"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Probiyom",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.probiyom.com/images/logo.svg"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": window.location.origin + buildRouteUrl('blog/' + slug)
      },
      "keywords": "probiyotik, sinbiyotik, hijyen, biyoteknoloji, HeiQ VivoTech, HeiQ Chrisal, alerjen, biyofilm, AMR, sürdürülebilirlik"
    };
    injectSchema(schema);
  }

  function injectBlogListSchema() {
    var schema = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Probiyom Blog & Bilimsel Makaleler",
      "description": "Probiyotik teknoloji, mikrobiyom sağlığı, sürdürülebilirlik ve biyolojik hijyen hakkında en güncel makaleler ve bilimsel yayınlar.",
      "url": window.location.origin + buildRouteUrl('blog'),
      "blogPosts": blogPosts ? blogPosts.slice(0, 10).map(function(post) {
        return {
          "@type": "BlogPosting",
          "headline": post.title,
          "url": window.location.origin + buildRouteUrl('blog/' + blogSlug(post))
        };
      }) : []
    };
    injectSchema(schema);
  }

  function injectFaqSchema() {
    var schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs ? faqs.map(function(item) {
        return {
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer.replace(/<\/?[^>]+(>|$)/g, "")
          }
        };
      }) : []
    };
    injectSchema(schema);
  }

  function injectContactPageSchema() {
    var schema = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "İletişim | Probiyom",
      "description": "Probiyom Ekibi ile iletişime geçin. Teknik bilgi, ürün talepleri ve iş birliği süreçleri için bize ulaşabilirsiniz.",
      "mainEntity": {
        "@type": "Organization",
        "name": "Probiyom",
        "url": "https://www.probiyom.com/",
        "logo": "https://www.probiyom.com/images/logo.svg",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": SiteData.address1,
          "addressLocality": "Kadıköy",
          "addressRegion": "İstanbul",
          "postalCode": "34732",
          "addressCountry": "TR"
        },
        "telephone": SiteData.phone,
        "email": SiteData.email,
        "sameAs": [
          SiteData.instagram,
          SiteData.x,
          SiteData.linkedin,
          SiteData.youtube
        ],
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": SiteData.lat,
          "longitude": SiteData.lon
        }
      }
    };
    injectSchema(schema);
  }

  function injectAboutPageSchema() {
    var schema = {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "Hakkımızda | Probiyom",
      "description": "Probiyom olarak HeiQ Chrisal iş birliğiyle yüzde yüz doğal ve sürdürülebilir probiyotik hijyen teknolojilerini yaşam alanlarınıza taşıyoruz.",
      "mainEntity": {
        "@type": "Organization",
        "name": "Probiyom",
        "url": "https://www.probiyom.com/",
        "logo": "https://www.probiyom.com/images/logo.svg",
        "description": "HeiQ VivoTech ve HeiQ Chrisal patentli probiyotik ve sinbiyotik hijyen teknolojileri sağlayıcısı.",
        "knowsAbout": [
          "Probiyotik Temizlik",
          "Sinbiyotik Hijyen",
          "Biyofilm Tabakası Temizliği",
          "HeiQ VivoTech Teknolojisi",
          "AMR (Antimikrobiyal Direnç) Önleme",
          "Sürdürülebilir Hijyen"
        ],
        "sameAs": [
          "https://instagram.com/probiyom",
          "https://x.com/probiyom",
          "https://linkedin.com/company/probiyom",
          "https://youtube.com/@Probiyom"
        ],
        "address": {
          "@type": "PostalAddress",
          "streetAddress": SiteData.address1,
          "addressLocality": "Kadıköy",
          "addressRegion": "İstanbul",
          "postalCode": "34732",
          "addressCountry": "TR"
        }
      }
    };
    injectSchema(schema);
  }

  function injectProductsPageSchema() {
    var schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Ürün Gruplarımız | Probiyom",
      "description": "Profesyonel temizlikten ev bakımına, hayvancılıktan kişisel bakıma kadar HeiQ Chrisal patentli probiyotik ve sinbiyotik hijyen ürünlerimizi keşfedin.",
      "url": window.location.origin + buildRouteUrl('products'),
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": Object.keys(GroupSlugToEnum).map(function(slug, index) {
          var enumVal = GroupSlugToEnum[slug];
          return {
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Product",
              "name": ProductGroupLabels[enumVal],
              "url": window.location.origin + buildRouteUrl('products/' + slug),
              "description": ProductGroupIntroText[enumVal] ? ProductGroupIntroText[enumVal].paragraph : ''
            }
          };
        })
      }
    };
    injectSchema(schema);
  }

  /* ---- Page initializers ---- */

    function initHomePage() {
        updateSEO(
          'Probiyotik & Sinbiyotik Temizlik Teknolojisi',
          'Yüzde yüz doğal, patentli HeiQ VivoTech probiyotik ve sinbiyotik temizlik teknolojisi ile yaşam alanlarınızda 72 saate kadar kalıcı ve sürdürülebilir hijyen çözümleri.',
          'home'
        );
    // Home page has no slider element - removed for performance
    // Schema is already in index.html for homepage
    }

  function initProductsPage() {
    updateSEO(
      'Ürün Gruplarımız',
      'Profesyonel temizlikten ev bakımına, hayvancılıktan kişisel bakıma kadar HeiQ Chrisal patentli probiyotik ve sinbiyotik hijyen ürünlerimizi keşfedin.',
      'products'
    );
    injectProductsPageSchema();

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
      updateNotFoundSEO('products/' + slug);
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
          currentSlider = ImageSlider(groupSliderEl, groupSlides, 4000);
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
    injectAboutPageSchema();

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
    injectFaqSchema();

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
        injectBlogPostSchema(post, slug);

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
    injectBlogListSchema();

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
    injectContactPageSchema();

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
      currentMap = ContactMap(mapEl, SiteData.lon, SiteData.lat, 15);
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
