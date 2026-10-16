/* Page rendering lives here; the router only resolves and loads routes.
   Every mount owns its resources and returns an idempotent disposer. */
var PageControllers = (function () {
  function mount(page, parameter, root) {
    var mainContainer = root;
    var currentSlider = null;
    var currentMap = null;
    var currentFaq = null;
    var homePage = null;
    var disposed = false;
    var updateSEO = PageSEO.update;
    var injectProductSchema = PageSEO.product;
    var injectBlogPostSchema = PageSEO.blogPost;
    var injectBlogListSchema = PageSEO.blogList;
    var injectFaqSchema = PageSEO.faq;
    var injectContactPageSchema = PageSEO.contact;
    var injectAboutPageSchema = PageSEO.about;
    var injectProductsPageSchema = PageSEO.products;
    function updateNotFoundSEO(route) {
      updateSEO('404 - Sayfa Bulunamadı', 'Aradığınız sayfa bulunamadı.', route);
    }
    function initHomePage() {
      updateSEO('Probiyotik & Sinbiyotik Temizlik Teknolojisi',
        'Yüzde yüz doğal, patentli HeiQ VivoTech probiyotik ve sinbiyotik temizlik teknolojisi ile yaşam alanlarınızda 72 saate kadar kalıcı ve sürdürülebilir hijyen çözümleri.', 'home');
      homePage = HomePage.mount(root);
    }
    function initProductsPage() {
      CategoryGrid(root.querySelector('[data-category-grid]'));
      updateSEO(
        'Ürün Gruplarımız',
        'Profesyonel temizlikten ev bakımına, hayvancılıktan kişisel bakıma kadar HeiQ Chrisal patentli probiyotik ve sinbiyotik hijyen ürünlerimizi keşfedin.',
        'products'
      );
      injectProductsPageSchema();

    }

    function initProductGroupPage(slug) {
      var groupEnum = GroupSlugToEnum[slug];
      if (groupEnum === undefined) {
        mainContainer.innerHTML =
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
      var headerEl = root.querySelector('#group-header');
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
                  '<img' + responsiveImageAttributes(groupIntro.imageDir, '(max-width: 767px) 100vw, 600px') + ' src="' + escapeAttr(groupIntro.imageDir) + '" alt="' + escapeAttr(imgAlt) + '">' +
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
          var groupSliderEl = root.querySelector('#group-intro-slider');
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
      var productsEl = root.querySelector('#group-products');
      if (productsEl) {
        ProductGrid(productsEl, groupProducts);
      }
    }

    function fillContactDetails(prefix) {
      var address = root.querySelector('#' + prefix + '-address');
      if (address) address.innerHTML = escapeHtml(SiteData.address1) + '<br>' + escapeHtml(SiteData.address2);
      ['phone', 'email'].forEach(function (field) {
        var element = root.querySelector('#' + prefix + '-' + field);
        if (!element) return;
        element.href = (field === 'phone' ? 'tel:' : 'mailto:') + SiteData[field];
        element.textContent = SiteData[field];
      });
      ['instagram', 'x', 'linkedin', 'youtube', 'trendyol'].forEach(function (field) {
        var element = root.querySelector('#' + prefix + '-' + field);
        if (element) element.href = SiteData[field];
      });
    }

    function initAboutPage() {
      updateSEO(
        'Hakkımızda',
        'Probiyom olarak HeiQ Chrisal iş birliğiyle yüzde yüz doğal ve sürdürülebilir probiyotik hijyen teknolojilerini yaşam alanlarınıza taşıyoruz.',
        'about'
      );
      injectAboutPageSchema();

      fillContactDetails('about');

      var socialEl = root.querySelector('#about-social');
      if (socialEl) {
        socialEl.innerHTML =
          '<a href="' + escapeAttr(SiteData.instagram) + '" target="_blank" rel="noopener">Instagram</a>' +
          ' &middot; ' +
          '<a href="' + escapeAttr(SiteData.x) + '" target="_blank" rel="noopener">Twitter / X</a>';
      }
    }

    function initFaqPage() {
      updateSEO(
        'Sıkça Sorulan Sorular',
        'Probiyotik ve sinbiyotik hijyen teknolojisi, kullanım alanları, 72 saat süren etkisi ve ürünlerimiz hakkında merak ettiğiniz tüm yanıtlar.',
        'faq'
      );
      injectFaqSchema();

      var listEl = root.querySelector('#faq-list');
      if (listEl) {
        currentFaq = FaqList(listEl, faqs);
      }
    }

    /* Blog list, slug detail, and legacy numeric IDs. */
    function initBlogPage(postParam) {
      var listEl = root.querySelector('#blog-list');

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
          var overview = root.querySelector('.section-header-wide');
          if (overview) overview.remove();
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

      fillContactDetails('contact');
      var storeLink = root.querySelector('#contact-store-link');
      if (storeLink) storeLink.href = SiteData.trendyol;

      /* Map */
      var mapEl = root.querySelector('#contact-map');
      if (mapEl) {
        currentMap = ContactMap(mapEl, SiteData.lon, SiteData.lat, 15);
      }

      /* Contact form */
      var formEl = root.querySelector('#contact-form-container');
      if (formEl) {
        ContactForm(formEl);
      }
    }


    var initializers = {
      home: initHomePage,
      about: initAboutPage,
      products: parameter ? function () { initProductGroupPage(parameter); } : initProductsPage,
      contact: initContactPage,
      faq: initFaqPage,
      blog: function () { initBlogPage(parameter); }
    };
    if (Object.prototype.hasOwnProperty.call(initializers, page)) initializers[page]();
    sizePageImages(root);
    return {
      destroy: function () {
        if (disposed) return;
        disposed = true;
        [homePage, currentSlider, currentMap, currentFaq].forEach(function (resource) {
          if (resource && resource.destroy) resource.destroy();
        });
      }
    };
  }
  return { mount: mount };
})();
