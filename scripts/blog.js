/* ===================================================================
   BlogList – Switches between list overview and dedicated reading view
   =================================================================== */

var activeBlogLightbox = null;

function BlogList(container, posts, initialIdentifier) {
  if (!posts || posts.length === 0) {
    container.innerHTML = '<div class="empty-state">Henüz blog yazısı eklenmedi.</div>';
    return;
  }

  // Adres satırından gelen identifier bir "sayı" (eski blog/0) ya da "slug" (blog/<slug>) olabilir.
  // Slug, başlıktan türetildiği için yeni yazı eklense de mevcut yazıların URL'i asla kaymaz.
  var viewIndex = -1;
  if (initialIdentifier !== undefined && initialIdentifier !== null && initialIdentifier !== '') {
    if (/^\d+$/.test(String(initialIdentifier))) {
      // Geriye dönük uyumluluk: eski sayısal linkler hâlâ çalışır
      var idx = parseInt(initialIdentifier, 10);
      if (idx >= 0 && idx < posts.length) viewIndex = idx;
    } else {
      var found = findBlogIndexBySlug(initialIdentifier, posts);
      if (found >= 0) viewIndex = found;
    }
  }

  if (viewIndex >= 0) {
    renderDetailView(viewIndex);
  } else {
    renderListView();
  }

  // 1. ÖZET KART LİSTESİ GÖRÜNÜMÜ
  function renderMetadata(post) {
    var value = post.datePublished;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    var date = new Date(value + 'T00:00:00Z');
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return '';
    var parts = value.split('-');
    return '<p class="blog-meta small text-muted mb-3"><time datetime="' + escapeAttr(value) + '">' +
      parts[2] + '.' + parts[1] + '.' + parts[0] + '</time> <span aria-hidden="true">&bull;</span> Probiyom</p>';
  }

  function renderListView() {
    var html = '<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 justify-content-center">';

    for (var i = 0; i < posts.length; i++) {
      var post = posts[i];
      var imageAlt = post.imageName || post.title || '';

      var snippet = getSnippet(post.text, 140);
      var postSlug = blogSlug(post);
      var postRoute = 'blog/' + postSlug;
      var postHref = window.Router && typeof window.Router.getRouteHref === 'function'
        ? window.Router.getRouteHref(postRoute)
        : '/' + postRoute + '/';

      var imageHtml = '';
      if (post.imageDir) {
        imageHtml =
          '<div class="blog-post-image position-relative overflow-hidden bg-white">' +
          '<img' + responsiveImageAttributes(post.imageDir, '(max-width: 767px) 100vw, 800px') + ' src="' + escapeAttr(post.imageDir) + '" alt="' + escapeAttr(imageAlt) + '" class="w-100 h-100 object-fit-contain p-2 transition-all" loading="lazy">' +
          '</div>';
      }

      html +=
        '<div class="col">' +
        '<article class="blog-post h-100 border border-light-subtle rounded-3 overflow-hidden d-flex flex-column shadow-sm bg-white cursor-pointer" data-index="' + i + '" data-slug="' + escapeAttr(postSlug) + '">' +
        imageHtml +
        '<div class="blog-post-body p-4 d-flex flex-column justify-content-between flex-grow-1">' +
        '<div>' +
        '<h2 class="blog-post-title fs-5 fw-bold mb-3 text-brand">' + escapeHtml(post.title) + '</h2>' +
        renderMetadata(post) +
        '<p class="blog-post-text text-muted small lh-relaxed mb-4">' + escapeHtml(snippet) + '</p>' +
        '</div>' +
        '<div class="text-start mt-auto">' +
        '<a href="' + escapeAttr(postHref) + '" aria-label="' + escapeAttr('Devamını oku: ' + post.title) + '" class="read-more-link text-decoration-none fw-bold small text-brand d-inline-flex align-items-center gap-1 transition-all">' +
        'Devamını Oku <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
        '</a>' +
        '</div>' +
        '</div>' +
        '</article>' +
        '</div>';
    }
    html += '</div>';

    container.innerHTML = html;

    // Karta tıklandığında adres satırındaki route değerini SEO dostu slug ile günceller
    var cards = container.querySelectorAll('.blog-post');
    cards.forEach(function (card) {
      card.addEventListener('click', function (event) {
        if (!event || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.target && event.target.closest && event.target.closest('a, button, input, select, textarea, summary, [contenteditable="true"]')) return;
        var slug = this.getAttribute('data-slug');
        if (slug) {
          if (window.Router && typeof window.Router.navigate === 'function') {
            window.Router.navigate('blog/' + slug);
          }
        } else {
          var idx = parseInt(this.getAttribute('data-index'), 10);
          if (window.Router && typeof window.Router.navigate === 'function') {
            window.Router.navigate('blog/' + idx);
          }
        }
      });
    });
  }

  // 2. TEKİL BLOG YAZISI OKUMA GÖRÜNÜMÜ (Yazı sonuna ikinci buton eklendi)
  function renderDetailView(index) {
    var post = posts[index];
    var imageAlt = post.imageName || post.title || '';

    // Metindeki \n\n işaretlerini düzgün paragraf etiketlerine çeviriyoruz
    var formattedTextHtml = formatBlogText(post.text);

    var imageHtml = '';
    if (post.imageDir) {
      imageHtml =
        '<div class="blog-detail-image rounded-3 overflow-hidden mb-4 shadow-sm bg-white text-center">' +
        '<img' + responsiveImageAttributes(post.imageDir, '(max-width: 767px) 100vw, 800px') + ' src="' + escapeAttr(post.imageDir) + '" alt="' + escapeAttr(imageAlt) + '" class="img-fluid object-fit-contain p-2" style="max-height: 480px; width: auto; margin: 0 auto;" loading="lazy">' +
        '</div>';
    }

    var detailHtml =
      '<article class="blog-detail-container max-w-5xl mx-auto py-2">' +
      /* 1. Geri Dön Butonu (Üstte) */
      '<button type="button" class="back-to-blog-btn d-inline-flex align-items-center gap-2 mb-4 text-brand fw-semibold border-0 bg-transparent p-0">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" class="transition-all"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
      'Blog Yazılarına Dön' +
      '</button>' +

      /* Görsel */
      imageHtml +

      /* Başlık & Metin */
      '<div class="blog-detail-body mt-2">' +
      '<h1 class="blog-detail-title text-brand mb-4 fw-bold fs-2">' + escapeHtml(post.title) + '</h1>' +
      renderMetadata(post) +
      '<div class="blog-detail-text fs-6 text-muted lh-lg">' + formattedTextHtml + '</div>' +
      '</div>' +

      /* YENİ: 2. Geri Dön Butonu (Yazı Bitiminde Altta) */
      '<div class="mt-5 pt-4 border-top border-light-subtle d-flex justify-content-start">' +
      '<button type="button" class="back-to-blog-btn d-inline-flex align-items-center gap-2 text-brand fw-semibold border-0 bg-transparent p-0">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" class="transition-all"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
      'Blog Yazılarına Dön' +
      '</button>' +
      '</div>' +

      '</article>';

    container.innerHTML = detailHtml;

    // Görsele Tıklayınca Lightbox Büyütme
    var detailImg = container.querySelector('.blog-detail-image img');
    if (detailImg) {
      detailImg.style.cursor = 'zoom-in';
      detailImg.setAttribute('tabindex', '0');
      detailImg.setAttribute('role', 'button');
      detailImg.setAttribute('aria-label', 'Görseli büyüt: ' + imageAlt);
      detailImg.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          detailImg.click();
        }
      });
      detailImg.addEventListener('click', function () {
        if (activeBlogLightbox) return;
        var lightbox = document.createElement('div');
        lightbox.className = 'blog-lightbox';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.setAttribute('aria-label', 'Büyük görsel görünümü');
        var closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'blog-lightbox-close';
        closeButton.setAttribute('aria-label', 'Görseli kapat');
        closeButton.textContent = '×';
        closeButton.style.position = 'fixed';
        closeButton.style.top = '1rem';
        closeButton.style.right = '1rem';
        closeButton.style.zIndex = '1';
        closeButton.style.fontSize = '2rem';
        closeButton.style.lineHeight = '1';
        closeButton.style.color = '#fff';
        closeButton.style.background = 'transparent';
        closeButton.style.border = '1px solid currentColor';
        closeButton.style.borderRadius = '50%';
        closeButton.style.width = '2.75rem';
        closeButton.style.height = '2.75rem';
        var lightboxImage = document.createElement('img');
        lightboxImage.src = post.imageDir;
        lightboxImage.alt = imageAlt;
        lightbox.appendChild(closeButton);
        lightbox.appendChild(lightboxImage);
        document.body.appendChild(lightbox);
        activeBlogLightbox = lightbox;
        var previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        var closeTimer = null;
        function closeLightbox(immediate, restoreFocus) {
          if (activeBlogLightbox !== lightbox) return;
          document.removeEventListener('keydown', onKeyDown);
          lightbox.classList.remove('is-active');
          if (closeTimer !== null) clearTimeout(closeTimer);
          var removeLightbox = function () {
            if (lightbox.parentNode) lightbox.parentNode.removeChild(lightbox);
            document.body.style.overflow = previousBodyOverflow;
            document.removeEventListener('routechange', onRouteChange);
            activeBlogLightbox = null;
            if (restoreFocus) detailImg.focus();
          };
          if (immediate) removeLightbox();
          else closeTimer = setTimeout(removeLightbox, 300);
        }
        function onKeyDown(event) {
          if (event.key === 'Escape') closeLightbox(false, true);
          else if (event.key === 'Tab') {
            event.preventDefault();
            closeButton.focus();
          }
        }
        function onRouteChange() { closeLightbox(true, false); }
        function onBackdropClick(event) {
          if (event.target === lightbox) closeLightbox(false, true);
        }
        closeButton.addEventListener('click', function () { closeLightbox(false, true); });
        lightbox.addEventListener('click', onBackdropClick);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('routechange', onRouteChange);

        requestAnimationFrame(function () {
          lightbox.classList.add('is-active');
        });
        closeButton.focus();
      });
    }

    // DÜZELTİLDİ: Hem üstteki hem alttaki 'Geri Dön' butonlarını yakalayan dinleyici
    var backBtns = container.querySelectorAll('.back-to-blog-btn');
    backBtns.forEach(function (backBtn) {
      backBtn.addEventListener('click', function () {
        if (window.Router && typeof window.Router.navigate === 'function') {
          window.Router.navigate('blog');
        }
      });
    });
  }

  function getSnippet(text, maxLength) {
    if (!text) return '';
    var cleanText = text.replace(/<\/?[^>]+(>|$)/g, "").replace(/\*\*([^\n*]+)\*\*/g, '$1');
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength).trim() + '...';
  }

  function formatBlogInline(text) {
    // Rebuild authored anchors; never copy arbitrary attributes or unsafe protocols.
    return text.split(/(<a\b[^>]*>[\s\S]*?<\/a>)/gi).map(function (part) {
      var link = part.match(/^<a\s+href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>$/i);
      if (!link) return formatText(part);
      var href = link[2];
      var label = formatText(link[3]);
      if (/^#\/?[a-z0-9/_-]+$/i.test(href)) href = SiteRoutes.href(href.replace(/^#\/?/, ''));
      if (/^\/(?:[a-z0-9_-]+\/?)*$/i.test(href)) {
        return '<a href="' + escapeAttr(SiteRoutes.href(href)) + '">' + label + '</a>';
      }
      if (/^https?:\/\/[^\s<>"']+$/i.test(href)) {
        try {
          href = new URL(href).href;
          return '<a href="' + escapeAttr(href) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
        } catch (error) { /* Invalid URLs render as plain text. */ }
      }
      return label;
    }).join('');
  }

  function formatBlogText(text) {
    if (!text) return '';
    var paragraphs = text.split(/\r?\n[ \t]*\r?\n/);
    var result = '';

    for (var i = 0; i < paragraphs.length; i++) {
      var pText = paragraphs[i].trim();
      if (!pText) continue;

      var heading = pText.match(/^<h([2-6])>([\s\S]*?)<\/h\1>$/i);
      if (heading) {
        result += '<h' + heading[1] + '>' + formatBlogInline(heading[2]) + '</h' + heading[1] + '>';
        continue;
      }

      if (pText.indexOf('\n-') !== -1 || pText.indexOf('- ') === 0) {
        var lines = pText.split('\n');
        var listHtml = '<ul class="ps-4 mb-4" style="list-style-type: disc;">';
        var inList = false;

        for (var j = 0; j < lines.length; j++) {
          var line = lines[j].trim();
          if (line.indexOf('-') === 0) {
            var cleanLine = line.substring(1).trim();
            listHtml += '<li class="mb-2 text-muted">' + formatBlogInline(cleanLine) + '</li>';
            inList = true;
          } else if (line) {
            if (inList) {
              listHtml += '</ul>';
              inList = false;
            }
            listHtml += '<p class="mb-3">' + formatBlogInline(line) + '</p>';
          }
        }
        if (inList) {
          listHtml += '</ul>';
        }
        result += listHtml;
      } else {
        result += '<p class="mb-4">' + formatBlogInline(pText) + '</p>';
      }
    }
    return result;
  }
}
