/* ===================================================================
   Utility helpers – must load before any component that renders HTML
   =================================================================== */

function responsiveImageAttributes(src, sizes) {
  var item = typeof ImageAssets !== 'undefined' && ImageAssets[src.split('?')[0]];
  if (!item) return '';
  return ' width="' + item.width + '" height="' + item.height + '"' +
    (item.srcset ? ' srcset="' + escapeAttr(item.srcset) + '" sizes="' + escapeAttr(sizes || '(max-width: 767px) 100vw, 800px') + '"' : '');
}

function setResponsiveImage(image, src, sizes) {
  var item = typeof ImageAssets !== 'undefined' && ImageAssets[src.split('?')[0]];
  if (item) {
    image.width = item.width;
    image.height = item.height;
    if (item.srcset) {
      image.sizes = sizes || '(max-width: 767px) 100vw, 800px';
      image.srcset = item.srcset;
    }
  }
  image.src = src;
}

function sizePageImages(root) {
  root.querySelectorAll('img[src]').forEach(function (image) {
    var src = image.getAttribute('src');
    var item = typeof ImageAssets !== 'undefined' && ImageAssets[src.split('?')[0]];
    if (!item) return;
    image.setAttribute('width', item.width);
    image.setAttribute('height', item.height);
    if (item.srcset && !image.hasAttribute('srcset')) {
      image.setAttribute('sizes', image.closest('.home-certificates') ? '220px' : '(max-width: 767px) 100vw, 800px');
      image.setAttribute('srcset', item.srcset);
    }
    if (image.closest('.home-certificates')) image.setAttribute('loading', 'lazy');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* Escape everything, then re-allow a small whitelist of inline
   formatting tags so hand-authored copy in data/*.js can use them.
   Allowed: <strong>, <em>, <u>, <br>. Anything else stays escaped,
   so the XSS safety net is preserved. */
function formatText(str) {
  if (!str) return '';
  return escapeHtml(str)
    .replace(/\*\*([^\n*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/&lt;(\/?)(strong|em|u)&gt;/g, '<$1$2>')
    .replace(/&lt;br\s*\/?&gt;/g, '<br>');
}

/* ===================================================================
   Blog Slug Yardımcıları
   =================================================================== */

/* Türkçe karakterleri ASCII'ye çevirir, noktalama/boşlukları tireye
   dönüştürür, ardışık tireleri tekler ve uçlardaki tireleri temizler.
   Örnek: "Çamaşır Yıkarken Gizli Tehlike" -> "camasir-yikarken-gizli-tehlike" */
function slugify(str) {
  if (!str) return '';
  var turkish = {
    'Ç': 'c', 'ç': 'c',
    'Ğ': 'g', 'ğ': 'g',
    'İ': 'i', 'ı': 'i',
    'I': 'i',
    'Ö': 'o', 'ö': 'o',
    'Ş': 's', 'ş': 's',
    'Ü': 'u', 'ü': 'u',
    ' ': '-'
  };
  return str
    .split('')
    .map(function (ch) { return turkish[ch] || ch; })
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* Bir yazının URL slug'ını döndürür. Veri dosyasında açıkça `slug`
   alanı tanımlanmışsa onu, aksi halde başlıktan otomatik üretir.
   Böylece dileyen kısa/temiz slug kullanabilir (ör. "camasir-tehlike"). */
function blogSlug(post) {
  if (post && post.slug) return post.slug;
  return slugify(post && post.title);
}

/* Slug'a karşılık gelen yazının dizi içindeki indeksini bulur.
   Bulunamazsa -1 döndürür. */
function findBlogIndexBySlug(slug, posts) {
  var list = posts || (typeof blogPosts !== 'undefined' ? blogPosts : []);
  if (!slug) return -1;
  for (var i = 0; i < list.length; i++) {
    if (blogSlug(list[i]) === slug) return i;
  }
  return -1;
}
