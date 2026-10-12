/* Route metadata and structured data, independent of page rendering. */
var PageSEO = (function () {
  var SITE_ORIGIN = 'https://www.probiyom.com';
  var DEFAULT_IMAGE = SITE_ORIGIN + '/images/homepage_sliders/hp_1.webp';

  function absoluteUrl(path) {
    if (!path) return SITE_ORIGIN + '/';
    try { return new URL(path, SITE_ORIGIN + '/').href; }
    catch (error) { return SITE_ORIGIN + '/'; }
  }

  function clearDynamicSchema() {
    var oldSchema = document.getElementById('dynamic-schema');
    if (oldSchema && oldSchema.parentNode) oldSchema.parentNode.removeChild(oldSchema);
  }

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
    var cleanPath = SiteRoutes.normalize(path || '');
    var pageUrl = absoluteUrl(SiteRoutes.href(cleanPath));
    canonical.setAttribute('href', pageUrl);

    // 4. OpenGraph Sosyal Medya Kartları
    updateMetaTag('og:title', title ? title + " | Probiyom" : "Probiyom");
    updateMetaTag('og:description', description || '');
    updateMetaTag('og:url', pageUrl);
    updateMetaTag('og:type', 'website');
    updateMetaTag('og:site_name', 'Probiyom');
    updateMetaTag('og:locale', 'tr_TR');
    updateMetaTag('og:image', DEFAULT_IMAGE);
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', title ? title + ' | Probiyom' : 'Probiyom', 'name');
    updateMetaTag('twitter:description', description || '', 'name');
    updateMetaTag('twitter:url', pageUrl, 'name');
    updateMetaTag('twitter:image', DEFAULT_IMAGE, 'name');
    updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1', 'name');
  }

  function updateMetaTag(property, content, attribute) {
    attribute = attribute || 'property';
    var tag = document.querySelector('meta[' + attribute + '="' + property + '"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, property);
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
      "url": absoluteUrl(SiteRoutes.href('products/' + slug)),
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": []
      }
    };
    injectSchema(schema);
  }

  function injectBlogPostSchema(post, slug) {
    var pageUrl = absoluteUrl(SiteRoutes.href('blog/' + slug));
    var imageUrl = post.imageDir ? absoluteUrl(post.imageDir) : DEFAULT_IMAGE;
    var articleDescription = post.text ? post.text.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 300) : '';
    updateMetaTag('og:type', 'article');
    updateMetaTag('og:image', imageUrl);
    updateMetaTag('twitter:image', imageUrl, 'name');
    updateMetaTag('twitter:title', post.title ? post.title + ' | Probiyom' : 'Probiyom', 'name');
    updateMetaTag('twitter:description', articleDescription, 'name');
    updateMetaTag('twitter:url', pageUrl, 'name');
    var schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.text ? post.text.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) : '',
      "image": imageUrl,
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
        "@id": pageUrl
      },
      "keywords": "probiyotik, sinbiyotik, hijyen, biyoteknoloji, HeiQ VivoTech, HeiQ Chrisal, alerjen, biyofilm, AMR, sürdürülebilirlik"
    };
    ['datePublished', 'dateModified'].forEach(function (field) {
      var value = post[field];
      var isoPattern = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/;
      var validDate = typeof value === 'string' && isoPattern.test(value) && !Number.isNaN(Date.parse(value));
      if (validDate && !value.includes('T')) {
        validDate = new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
      }
      if (validDate) {
        schema[field] = post[field];
      }
    });
    injectSchema(schema);
  }

  function injectBlogListSchema() {
    var schema = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Probiyom Blog & Bilimsel Makaleler",
      "description": "Probiyotik teknoloji, mikrobiyom sağlığı, sürdürülebilirlik ve biyolojik hijyen hakkında en güncel makaleler ve bilimsel yayınlar.",
      "url": absoluteUrl(SiteRoutes.href('blog')),
      "blogPosts": blogPosts ? blogPosts.slice(0, 10).map(function(post) {
        return {
          "@type": "BlogPosting",
          "headline": post.title,
          "url": absoluteUrl(SiteRoutes.href('blog/' + blogSlug(post)))
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
      "url": absoluteUrl(SiteRoutes.href('products')),
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
              "url": absoluteUrl(SiteRoutes.href('products/' + slug)),
              "description": ProductGroupIntroText[enumVal] ? ProductGroupIntroText[enumVal].paragraph : ''
            }
          };
        })
      }
    };
    injectSchema(schema);
  }


  return {
    update: updateSEO,
    clear: clearDynamicSchema,
    product: injectProductSchema,
    blogPost: injectBlogPostSchema,
    blogList: injectBlogListSchema,
    faq: injectFaqSchema,
    contact: injectContactPageSchema,
    about: injectAboutPageSchema,
    products: injectProductsPageSchema
  };
})();
