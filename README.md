# Probiyom Website

**Probiyom** is a brand operating under [IDOL Invest](https://www.idolinvest.com/), offering probiotic and prebiotic-based cleaning, personal care, and industrial products. This repository contains the source code for Probiyom's corporate website.

---

**Probiyom**, [IDOL Invest](https://www.idolinvest.com/) bünyesinde faaliyet gösteren, probiyotik ve prebiyotik bazlı temizlik, kişisel bakım ve endüstriyel ürünler sunan bir markadır. Bu repo, Probiyom'un kurumsal web sitesinin kaynak kodunu içermektedir.

---

## Technical Structure / Teknik Yapı

A plain HTML/CSS/JS application with path-based navigation. Production builds pre-render each route to HTML for visitors, search engines and social previews.

Page URLs use a trailing slash: `/contact/` redirects to `/contact/`. The same rule applies to blog articles and product groups.
Legacy page hashes such as `/#contact` and `/#/products/home_cleaning` migrate to path URLs.
Each route has its own content template under `pages/`, loaded into the shared `index.html` shell.
Real content fragments (for example `/faq/#faq-answer-0`) remain intact.

Saf HTML/CSS/JS ile geliştirilmiştir. Yayın öncesi derleme her rota için içerik ve SEO etiketlerini içeren HTML üretir; sayfa içi gezinme mevcut router ile devam eder.

## Pages / Sayfalar

| Route | EN | TR |
|---|---|---|
| `/` | Home | Ana sayfa |
| `/about/` | About | Hakkımızda |
| `/products/` | Product catalogue | Ürün kataloğu |
| `/products/<slug>/` | Product group detail | Ürün grubu detayı |
| `/contact/` | Contact | İletişim |
| `/faq/` | FAQ | SSS |
| `/blog/` | Blog | Blog |
| `/blog/<slug>/` | Blog article | Blog yazısı |

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

Run `npm run build` after content changes, then `python serve.py 7076` for preview. Each clean URL receives ready HTML from `seo-pages/`; browser navigation retains the existing router. Unknown routes return HTTP 404. Deploy the generated `dist/` package. See [SEO build instructions](docs/seo-build.md) for dependencies and hosting setup.

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

