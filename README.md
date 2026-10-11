# Probiyom Website

**Probiyom** is a brand operating under [IDOL Invest](https://www.idolinvest.com/), offering probiotic and prebiotic-based cleaning, personal care, and industrial products. This repository contains the source code for Probiyom's corporate website.

---

**Probiyom**, [IDOL Invest](https://www.idolinvest.com/) bünyesinde faaliyet gösteren, probiyotik ve prebiyotik bazlı temizlik, kişisel bakım ve endüstriyel ürünler sunan bir markadır. Bu repo, Probiyom'un kurumsal web sitesinin kaynak kodunu içermektedir.

---

## Technical Structure / Teknik Yapı

A single-page application built with plain HTML/CSS/JS, requiring no framework or build step. Page transitions are managed by a path-based router.

Routes use URLs without a trailing slash: `/contact/` normalizes to `/contact`.
Legacy page hashes such as `/#contact` and `/#/products/home_cleaning` migrate to path URLs.
Each route has its own content template under `pages/`, loaded into the shared `index.html` shell.
Real content fragments (for example `/faq#faq-answer-0`) remain intact.

Framework veya build adımı gerektirmeyen, saf HTML/CSS/JS ile geliştirilmiş tek sayfalı bir uygulamadır. Sayfa geçişleri path tabanlı bir router ile yönetilir.

## Pages / Sayfalar

| Route | EN | TR |
|---|---|---|
| `/` | Home | Ana sayfa |
| `/about` | About | Hakkımızda |
| `/products` | Product catalogue | Ürün kataloğu |
| `/products/<slug>` | Product group detail | Ürün grubu detayı |
| `/contact` | Contact | İletişim |
| `/faq` | FAQ | SSS |
| `/blog` | Blog | Blog |
| `/blog/<slug>` | Blog article | Blog yazısı |

## Folder Structure / Klasör Yapısı

```
probiyom-website/
├── index.html        # App shell / Uygulama kabuğu
├── pages/            # HTML partials loaded by router / Router tarafından yüklenen HTML parçaları
├── styles/           # CSS modules / CSS modülleri
├── scripts/          # JS modules / JS modülleri
├── data/             # Product, slide and site data / Ürün, slayt ve site verisi
└── images/           # Static assets / Statik görseller
```

## Running Locally / Yerel Geliştirme

The router loads page partials via `fetch()` and uses clean path URLs (no hash), so the site must be served over HTTP and unknown routes must fall back to `index.html`. Use the provided SPA-fallback server so deep links (`/contact`, `/blog/<slug>`) work on refresh and direct open.

Router, sayfa parçalarını `fetch()` ile yüklediği ve hash'siz gerçek yol kullandığı için dosyanın doğrudan tarayıcıda açılması çalışmaz. Derin bağlantıların 404 vermemesi için SPA fallback'li sunucuyu kullanın:

```bash
# SPA fallback'li yerel sunucu (ÖNERİLEN) — yenileme / doğrudan link / geri dönüşte 404 çıkmaz
python serve.py          # http://localhost:7076/
python serve.py 8080     # istediğiniz port

# Windows: start.bat dosyasına çift tıklayabilirsiniz.

# NOT: Aşağıdaki basit sunucular SPA fallback yapmaz; /blog/<slug> gibi bir sayfada
# yenileme veya doğrudan girişte 404 döndürür.
# python -m http.server 8080
# npx serve .
```

### Production / Canlıya Alma (nginx)
Yayına alırken doğrudan açılan `/contact` veya `/blog/<slug>` adreslerinin 404 vermemesi için nginx'te şu SPA fallback kuralını kullanın (hazır şablon: `new-probiyom/nginx-probiyom.conf`):

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Bu kural, gerçek bir dosya yoksa isteği `index.html`'e düşürür; router adresteki gerçek yolu okuyup doğru sayfayı çizer.
