Tüm yerel dosya yolları (`file:///c:/...`) temizlenerek `.../Probiyom/probiyom-website-main/...` formatına getirilmiş, son geliştirdiğimiz **dinamik SEO (sitemap, robots.txt, schema.org), pop-up modal, direkt API form gönderimi ve saf CSS slayt modülleri** rehbere entegre edilmiştir.

Güncellenmiş **`site_analysis.md`** dosyanızın içeriği şu şekildedir:

```markdown
# Probiyom Web Sitesi Çalışma ve Veri Akış Rehberi

Bu doküman, **Probiyom** web sitesinin yazılımsal mimarisini, sayfa yapısını, arama motoru optimizasyonunu (SEO) ve hangi verinin (metin, resim, link vb.) hangi dosyadan çekilerek nasıl yüklendiğini detaylı bir şekilde açıklamaktadır.

---

## 1. Genel Mimari ve Çalışma Mantığı

Probiyom web sitesi, modern bir **Single Page Application (SPA - Tek Sayfa Uygulaması)** olarak tasarlanmıştır. 
* **Tek Giriş Noktası:** Tüm site [.../Probiyom/probiyom-website-main/index.html](.../Probiyom/probiyom-website-main/index.html) dosyası üzerinden yüklenir.
* **Sunucu Tarafı Olmayan Yapı (Serverless/Static):** Sitede bir veritabanı veya dinamik API sunucusu bulunmaz. Bunun yerine tüm içerikler (ürünler, bloglar, sıkça sorulan sorular, site bilgileri) [.../Probiyom/probiyom-website-main/data/](.../Probiyom/probiyom-website-main/data/) klasöründeki statik JavaScript dosyalarında (`.js` formatında nesneler olarak) saklanır.
* **Dinamik Yükleme (Routing):** Ziyaretçi menüden bir sayfaya tıkladığında, tarayıcı adres satırındaki hash değeri (örneğin `#home`, `#about`, `#products`, `#blog`) değişir. Bu değişimi yakalayan [.../Probiyom/probiyom-website-main/scripts/router.js](.../Probiyom/probiyom-website-main/scripts/router.js) dosyası, ilgili sayfa şablonunu (örneğin `pages/home.html`) asenkron olarak çeker (`fetch`) ve [.../Probiyom/probiyom-website-main/index.html](.../Probiyom/probiyom-website-main/index.html) içerisindeki `#page-content` alanına yerleştirir. Ardından ilgili verileri bu şablonun üzerine dinamik olarak yazar (hydrates).
* **Dinamik SEO ve Şema Yönetimi:** `router.js` bileşeni her sayfa değişiminde sayfa başlığını (`document.title`), arama motoru özetlerini (`meta description`), kalıcı bağlantıları (`canonical URL`) ve Google zengin sonuçlar için `JSON-LD Schema.org` verilerini dinamik olarak tarayıcıya basar.

---

## 2. Klasör ve Dosya Yapısı

Sitenin ana dizin yapısı ve temel işlevleri şu şekildedir:

```text
probiyom-website-main/
│
├── index.html                  # Sitenin ana giriş kapısı (iskelet ve SEO meta alanı)
├── sitemap.xml                 # Google indekslemesi için otomatik site haritası
├── robots.txt                  # Arama motoru tarama talimatları (GEO / llms.txt referansı dahil)
├── llms.txt                    # Yeni Nesil AI / GEO: Yapay zekaların (ChatGPT, Perplexity, Gemini) okuduğu site + blog özeti
├── performans-demo.html        # Slider dönüşümü için A/B karşılaştırma demosu (geçici ve bağımsız dosya)
│
├── data/                       # Verilerin saklandığı JavaScript dosyaları
│   ├── site.js                 # Şirket iletişim, sosyal medya ve harita koordinatları
│   ├── products.js             # Ürün grupları, tanıtım metinleri ve tüm ürün listesi
│   ├── blogs.js                # Blog yazıları, içerikleri ve resim yolları
│   ├── faqs.js                 # Sıkça Sorulan Sorular (Soru - Cevap çiftleri)
│   ├── slides.js               # Ana sayfa ve Ürünler sayfasındaki slider görselleri
│   └── subjects.js             # İletişim formundaki mesaj konuları
│
├── pages/                      # Sayfaların HTML şablonları (Partials)
│   ├── home.html               # Ana sayfa şablonu (Slogan, inovasyon sütunları, makale akışı)
│   ├── about.html              # Hakkımızda şablonu
│   ├── products.html           # Ürün grupları genel listeleme şablonu
│   ├── product-group.html      # Belirli bir ürün grubunun detay şablonu
│   ├── blog.html               # Blog genel listeleme ve detay okuma şablonu
│   ├── faq.html                # SSS şablonu
│   ├── contact.html            # İletişim sayfası şablonu
│   └── not-found.html          # 404 Hata sayfası şablonu
│
├── scripts/                    # Dinamik işlevleri sağlayan JavaScript bileşenleri
│   ├── app.js                  # Uygulama başlatıcı (Navbar, Footer ve Router'ı yükler)
│   ├── router.js               # Hash tabanlı yönlendirici, SEO ve sayfa doldurucuları
│   ├── navbar.js               # Dinamik menü, yüzen kapsül ve Pop-Up modal yönetimi
│   ├── footer.js               # Dinamik footer ve sosyal medya bileşeni
│   ├── slider.js               # Otomatik dönen görsel kaydırıcı (Carousel) bileşeni
│   ├── product-grid.js         # Ürünleri kart yapısında ızgara olarak listeleyen bileşen
│   ├── blog.js                 # Blog özetlerini ve tekil oku detay görünümünü yöneten bileşen
│   ├── faq.js                  # SSS Soru-Cevap akordeon bileşeni (scrollHeight destekli)
│   ├── contact-form.js         # İletişim formu API gönderimi (Web3Forms/Formspree)
│   ├── contact-map.js          # OpenLayers kütüphanesi ile harita çizimi
│   └── helpers.js              # HTML güvenlik filtreleri (XSS önleme ve biçimlendirme)
│
└── styles/                     # Görsel tasarımları belirleyen CSS dosyaları
    └── main.css                # Tüm sitenin stil kuralları, renk paleti ve responsive düzenleri
```

---

## 3. Sayfa Sayfa Veri Akış Haritası

Hangi sayfanın, hangi veriyi nereden çekip kullanıcıya gösterdiğine dair detaylı tablo:

| Sayfa (Hash Rota) | Yüklenen HTML Şablonu | Kullanılan Veri Dosyası (JS Değişkeni) | Verinin Çekildiği Alan ve Açıklama |
| :--- | :--- | :--- | :--- |
| **Genel Şablon (Header / Nav)** | [.../Probiyom/probiyom-website-main/index.html](.../Probiyom/probiyom-website-main/index.html) (Statik) | [.../Probiyom/probiyom-website-main/data/products.js](.../Probiyom/probiyom-website-main/data/products.js) (`GroupSlugToEnum`, `ProductGroupLabels`) | **Menü Linkleri:** Ürün grupları dinamik olarak okunup üst menüdeki "Ürünlerimiz" açılır listesine link (`#products/<slug>`) ve başlık olarak eklenir. Ayrıca "Bize Ulaşın" Pop-Up Modal tetikleyicisi yer alır. |
| **Genel Şablon (Footer)** | [.../Probiyom/probiyom-website-main/index.html](.../Probiyom/probiyom-website-main/index.html) (Statik) | [.../Probiyom/probiyom-website-main/data/site.js](.../Probiyom/probiyom-website-main/data/site.js) (`SiteData`) | **İletişim ve Adres:** Şirketin adresi, telefonu, e-postası ve sosyal medya linkleri alt bilgiye yazılır. |
| **Ana Sayfa** (`#home` veya boş) | [.../Probiyom/probiyom-website-main/pages/home.html](.../Probiyom/probiyom-website-main/pages/home.html) | [.../Probiyom/probiyom-website-main/data/slides.js](.../Probiyom/probiyom-website-main/data/slides.js) (`homeSlides`, `productSlides`) | **Ana Slayt:** Üst kısımdaki büyük görseller (`homeSlides`) yüklenir.<br>**Ürün Grupları Slaytı:** Alt kısımdaki ürün kategori slaytları (`productSlides`) linkleri ile yerleştirilir.<br>**Akademik Yayınlar & Slogan:** Biyoteknoloji içerikleri ve dinamik bilimsel makale kartları şablon üzerinden okunur. |
| **Hakkımızda** (`#about`) | [.../Probiyom/probiyom-website-main/pages/about.html](.../Probiyom/probiyom-website-main/pages/about.html) | [.../Probiyom/probiyom-website-main/data/site.js](.../Probiyom/probiyom-website-main/data/site.js) (`SiteData`) | **Adres ve İletişim Bilgileri:** Sayfanın altındaki iletişim alanları `SiteData` içinden çekilir.<br>**Vizyon & Misyon:** `about.html` içindeki statik metinlerden gelir. |
| **Ürünler Genel** (`#products`) | [.../Probiyom/probiyom-website-main/pages/products.html](.../Probiyom/probiyom-website-main/pages/products.html) | [.../Probiyom/probiyom-website-main/data/slides.js](.../Probiyom/probiyom-website-main/data/slides.js) (`productSlides`) | **Ürün Grubu Seçim Sliderı:** Kullanıcının ürün gruplarına tıklamasını sağlayan slider (`productSlides`) yüklenir. |
| **Ürün Grubu Detay** (`#products/<slug>`) | [.../Probiyom/probiyom-website-main/pages/product-group.html](.../Probiyom/probiyom-website-main/pages/product-group.html) | [.../Probiyom/probiyom-website-main/data/products.js](.../Probiyom/probiyom-website-main/data/products.js) (`ProductGroupLabels`, `ProductGroupIntroText`, `products`) | **Grup Tanıtım Metinleri & Header Slider:** Seçilen gruba ait başlık, giriş maddeleri (`bullets`), açıklama paragrafı, uyarı metni ve dikey/yatay slayt görselleri (`images`) `ProductGroupIntroText` nesnesinden çekilir.<br>**Ürün Kartları:** Ürünler `products` dizisinden filtrelenerek ad, açıklama, özellik şeritleri, kırpılmayı önleyen resim yuvası ve stok durumu olarak listelenir. |
| **Blog** (`#blog`) | [.../Probiyom/probiyom-website-main/pages/blog.html](.../Probiyom/probiyom-website-main/pages/blog.html) | [.../Probiyom/probiyom-website-main/data/blogs.js](.../Probiyom/probiyom-website-main/data/blogs.js) (`blogPosts`) | **Blog Listesi ve Tekil Okuma:** Tüm blog yazılarının başlıkları, özetleri ve görselleri bu dosyadan çekilir. Tıklandığında sayfa yenilenmeden tekil okuma görünümüne (Detail View) geçilir. |
| **Sıkça Sorulan Sorular** (`#faq`) | [.../Probiyom/probiyom-website-main/pages/faq.html](.../Probiyom/probiyom-website-main/pages/faq.html) | [.../Probiyom/probiyom-website-main/data/faqs.js](.../Probiyom/probiyom-website-main/data/faqs.js) (`faqs`) | **Akordeon SSS Listesi:** Sorular ve cevaplar çekilir. Cevaplardaki `<strong>`, `<br>` gibi biçimlendirmeler `helpers.js`'teki süzgeçten geçirilerek dinamik yükseklikle akıcı bir şekilde açılır. |
| **İletişim** (`#contact`) | [.../Probiyom/probiyom-website-main/pages/contact.html](.../Probiyom/probiyom-website-main/pages/contact.html) | [.../Probiyom/probiyom-website-main/data/site.js](.../Probiyom/probiyom-website-main/data/site.js) (`SiteData`), [.../Probiyom/probiyom-website-main/data/subjects.js](.../Probiyom/probiyom-website-main/data/subjects.js) (`MessageSubjects`), [.../Probiyom/probiyom-website-main/data/products.js](.../Probiyom/probiyom-website-main/data/products.js) (`ProductGroupLabels`) | **İletişim Detayları:** Telefon, e-posta ve sosyal medya linkleri `SiteData`'dan alınır.<br>**Harita Koordinatları:** Haritayı merkezlemek için `SiteData.lat` ve `SiteData.lon` koordinatları OpenLayers harita motoruna iletilir.<br>**Form Gönderimi:** Konu başlıkları ve ürün grupları dinamik doldurulur; mesajlar arka planda Web3Forms / Formspree API aracılığıyla doğrudan e-postaya yönlendirilir. |

---

## 4. Detaylı Kod ve Veri Bağlantıları

### A. İletişim Bilgileri ve Harita
* **Nereden Çekiliyor:** [.../Probiyom/probiyom-website-main/data/site.js](.../Probiyom/probiyom-website-main/data/site.js)
```javascript
var SiteData = {
    address1: "Merdivenköy Mahallesi, Dikyol Sokak, B Blok, No 2/179",
    address2: "Kadıköy, İstanbul, Türkiye, 34732",
    phone: "+90-532-346-48-84",
    email: "probiyom@idolinvest.com",
    instagram: "https://www.instagram.com/probiyom/",
    x: "https://x.com/probiyom",
    linkedin: "https://www.linkedin.com/company/probiyom",
    youtube: "https://www.youtube.com/@Probiyom",
    lat: 40.992680,
    lon: 29.068512,
};
```
* **Nereye ve Nasıl Aktarılıyor:** 
  1. `initContactPage()` fonksiyonu ([.../Probiyom/probiyom-website-main/scripts/router.js](.../Probiyom/probiyom-website-main/scripts/router.js)), bu nesneden telefon, e-posta ve sosyal medya URL'lerini okuyup DOM elementlerine (`contact-phone`, `contact-email`, vb.) enjekte eder.
  2. `ContactMap(mapEl, SiteData.lon, SiteData.lat, 15)` çağrılarak harita oluşturulur. [.../Probiyom/probiyom-website-main/scripts/contact-map.js](.../Probiyom/probiyom-website-main/scripts/contact-map.js) içerisinde OpenLayers kütüphanesi kullanılarak monokromatik gri tonlamalı haritaya bir konum işaretçisi (marker) yerleştirilir.

### B. Ürün Grupları ve Ürün Detayları
* **Nereden Çekiliyor:** [.../Probiyom/probiyom-website-main/data/products.js](.../Probiyom/probiyom-website-main/data/products.js)
  * `ProductGroup` (Enum): Ürün gruplarını sayısal kimliklerle eşleştirir (örn. `HomeCleaning: 2`).
  * `ProductGroupLabels`: Sayısal kimlikleri Türkçe isimlerle eşleştirir (örn. `ProductGroup.HomeCleaning = "Ev Temizlik Ürünleri"`).
  * `GroupSlugToEnum`: URL slug'larını enum değerleriyle eşleştirir (örn. `home_cleaning` -> `ProductGroup.HomeCleaning`). Adres satırında `#products/home_cleaning` yazıldığında hangi grubun yükleneceği tespit edilir.
  * `ProductGroupIntroText`: Her ürün grubu sayfasının üstünde bulunan tanıtım metinleri ve tanıtım slayt görselleri (`images` dizisi).
  * `products` (Dizi): Sitedeki tüm ürünlerin listesidir. Her ürün barkod, grup enum ID'si, ürün adı, açıklama, kırpılmayı önleyen resim yolu (`imageDir`), satış durumu (`isAvailable`) ve özellik listesi (`bullets`) içerir.
* **Nereye ve Nasıl Aktarılıyor:**
  * Router içindeki `initProductGroupPage(slug)` fonksiyonu çalıştırılır. 
  * Tanıtım metinleri ve çoklu tanıtım slaytları okunan veriler doğrultusunda [.../Probiyom/probiyom-website-main/pages/product-group.html](.../Probiyom/probiyom-website-main/pages/product-group.html) şablonundaki `id="group-header"` alanına yazılır.
  * `products` dizisindeki ürünler filtrelenerek [.../Probiyom/probiyom-website-main/scripts/product-grid.js](.../Probiyom/probiyom-website-main/scripts/product-grid.js) bileşenine gönderilir. Bu bileşen görselleri kartın en altına sabitleyen (`margin-top: auto`) ve kırpmayan (`object-fit: contain`) HTML kartlarını `id="group-products"` alanına basar.

### C. Blog İçerikleri ve Tekil Okuma Görünümü
* **Nereden Çekiliyor:** [.../Probiyom/probiyom-website-main/data/blogs.js](.../Probiyom/probiyom-website-main/data/blogs.js)
  * `blogPosts`: Sitedeki tüm blog makalelerini tutan dizidir.
* **Nereye ve Nasıl Aktarılıyor:**
  * Rota `#blog` olduğunda `initBlogPage()` tetiklenir ve `BlogList(listEl, blogPosts)` fonksiyonu ([.../Probiyom/probiyom-website-main/scripts/blog.js](.../Probiyom/probiyom-website-main/scripts/blog.js)) çağrılır.
  * Kullanıcı ilk girdiğinde makalelerin 140 karakterlik özetlerinden oluşan kartlar listelenir. Herhangi bir karta tıklandığında `renderDetailView(index)` fonksiyonu çalışır ve sayfa yenilenmeden ilgili makale tam metin ve geniş görseliyle okunabilir formata geçer.

### D. SSS (Sıkça Sorulan Sorular)
* **Nereden Çekiliyor:** [.../Probiyom/probiyom-website-main/data/faqs.js](.../Probiyom/probiyom-website-main/data/faqs.js)
* **Nereye ve Nasıl Aktarılıyor:**
  * `#faq` rotasında `initFaqPage()` tetiklenerek `FaqList(listEl, faqs)` çalıştırılır ([.../Probiyom/probiyom-website-main/scripts/faq.js](.../Probiyom/probiyom-website-main/scripts/faq.js)).
  * Tıklandığında `scrollHeight` değerini dinamik ölçen akıcı akordiyon mekanizması sayesinde cevap metinleri takılmadan açılıp kapanır.

### E. İletişim Formu ve Arka Plan Gönderimi
* **Nereden Çekiliyor:** [.../Probiyom/probiyom-website-main/data/subjects.js](.../Probiyom/probiyom-website-main/data/subjects.js) ve [.../Probiyom/probiyom-website-main/data/products.js](.../Probiyom/probiyom-website-main/data/products.js)
* **Nereye ve Nasıl Aktarılıyor:**
  * [.../Probiyom/probiyom-website-main/scripts/contact-form.js](.../Probiyom/probiyom-website-main/scripts/contact-form.js) içindeki `ContactForm` bileşeni formu oluşturur.
  * Kullanıcı formu doldurup gönderdiğinde `fetch` API ile arka planda `https://api.web3forms.com/submit` servisine asenkron istek atılır; e-posta uygulaması açılmadan mesaj doğrudan ilgili e-posta adresine iletilir.

---

## 5. Görsel Öğeler (Slider ve Resimler)

Sitedeki ana slayt gösterileri [.../Probiyom/probiyom-website-main/scripts/slider.js](.../Probiyom/probiyom-website-main/scripts/slider.js) içerisindeki `ImageSlider` modülü tarafından kontrol edilir:
* Slaytların resim yolları (`src`), alt metinleri (`alt`), başlıkları ve linkleri [.../Probiyom/probiyom-website-main/data/slides.js](.../Probiyom/probiyom-website-main/data/slides.js) içinden okunur.
* Slaytlar 7 saniyede bir (`durationMs = 7000`) sağdan sola doğru donanım hızlandırmalı bir ray (`slider-track`) üzerinde kayarak ilerler.
* `home.html` içindeki dikey bilimsel kapak slaytı ise sıfır JavaScript yükü getiren **%100 saf CSS (`@keyframes cssFadeSlideshow`)** yapısıyla çalışır.

---

## 6. Güvenlik ve Yardımcı İşlevler (Helpers)

Dinamik HTML oluşturulurken XSS güvenlik zafiyetlerini önlemek amacıyla [.../Probiyom/probiyom-website-main/scripts/helpers.js](.../Probiyom/probiyom-website-main/scripts/helpers.js) içerisindeki şu süzgeçler kullanılır:
1. `escapeHtml(str)`: Metindeki `<`, `>`, `&`, `"` gibi karakterleri HTML entity karşılıklarına (`&lt;`, `&gt;` vb.) dönüştürerek zararlı kodların çalıştırılmasını engeller.
2. `escapeAttr(str)`: HTML niteliklerindeki çift tırnak karakterlerini temizler.
3. `formatText(str)`: Güvenli metin biçimlendirme etiketlerine (`<strong>`, `<em>`, `<u>`, `<br>`) izin verir.
4. `slugify(str)`, `blogSlug(post)`, `findBlogIndexBySlug(slug, posts)`: **Blog SEO'su için eklenen slug yardımcıları** (bkz. Bölüm 7 / B). Türkçe karakterleri ASCII'ye çevirir ve başlıktan anlamlı, sabit bir URL slug'ı üretir.

---

## 7. Yeni Nesil AI / GEO ve Son Güncellemeler (Değişiklik Kaydı)

Bu bölüm, rehberin hazırlanmasından sonra eklenen tüm yeni özellik ve iyileştirmeleri (AI / GEO uyumu, blog SEO'su ve performans çalışması) özetler.

### A. Yeni Nesil AI / GEO Desteği (`llms.txt` + `robots.txt`)
* **Hedef:** `llms.txt` standardı (https://llmstxt.org/) sayesinde **yapay zeka asistanlarının** (ChatGPT, Perplexity, Gemini, Claude vb.) markayı ve blog yazılarını güvenilir bir kaynak olarak tanıyıp atıf yapabilmesini sağlamak (Generative Engine Optimization - GEO).
* **`llms.txt` (site kökünde):** Sitenin kimliğini (Probiyom, IDOL Invest, HeiQ Chrisal & VivoTech) ve **5 blog yazısının tamamını** `URL`, `Özet` ve `Çözüm` alanlarıyla yapılandırılmış biçimde içerir.
* **`robots.txt`:** `LLM-TXT: https://www.probiyom.com/llms.txt` ve yedek `Sitemap:` referansı eklenerek AI tarayıcılarının `llms.txt`'e ulaşması kolaylaştırıldı.
* **Yayın notu:** Her iki dosya da ana sayfa ile aynı dizinde olmalıdır → `https://www.probiyom.com/llms.txt` ve `https://www.probiyom.com/robots.txt`.

### B. Blog SEO'su: Slug Tabanlı URL Sistemi (`#blog/<slug>`)
* **Önceki durum:** Blog URL'leri sayısal indekse bağlıydı (`#blog/0`, `#blog/1` …). Yeni yazı eklendiğinde ya da sıralama değiştiğinde mevcut linkler anlamını yitiriyordu.
* **Yeni durum:** Her yazı, **başlığından otomatik türetilen** anlamlı ve SEO dostu bir `slug` ile erişilir. Slug, içerikten türediği için **yeni yazı eklense de mevcut URL'ler asla kaymaz.**
* **Yapılan kod değişiklikleri:**
  1. `scripts/helpers.js` — üç yeni yardımcı:
     - `slugify(str)`: Türkçe karakterleri ASCII'ye çevirir (`Ç→c`, `İ→i`, `ı→i`, `Ş→s`, `Ü→u`, `Ö→o`), noktalama ve boşlukları tireye dönüştürür, fazla tireleri temizler.
     - `blogSlug(post)`: Yazının slug'ını döndürür (isteğe bağlı `post.slug` alanı varsa onu, yoksa başlıktan üretir — kısa/temiz URL istenirse veri dosyasına elle `slug` eklenebilir).
     - `findBlogIndexBySlug(slug, posts)`: Slug'ı yazıya eşler, bulamazsa `-1`.
  2. `scripts/blog.js` — `BlogList` artık sayı **veya** slug alır; blog kartları `#blog/<slug>` linkini üretir.
  3. `scripts/router.js` — `initBlogPage` slug'ı çözer, SEO başlığını/canonical'i `/slug` ile günceller. **Geriye dönük uyumluluk korundu:** eski sayısal `#blog/N` linkleri de çalışmaya devam eder.
* **URL örnekleri (5 yazı):**
  - `#blog/camasir-yikarken-gizli-tehlike-yumusaticilar-kalp-sagligimizi-nasil-etkiliyor`
  - `#blog/gorunmez-kuresel-tehdit-antibiyotik-direnci-amr-gelecegimizin-en-buyuk-tehdidi-mi`
  - `#blog/alerjinize-karsi-yeni-nesil-sinbiyotik-guc`
  - `#blog/bir-ciftlikte-hijyen-sadece-temizlik-midir-yoksa-hastaliklari-onleyen-gorunmez-bir-savunma-hatti-mi`
  - `#blog/endustriyel-su-sistemlerinde-gorunmeyen-maliyet-biyofilm`

### C. Performans Çalışması (Analiz + Slider Dönüşüm Demosu)
* **Analiz bulguları (en büyük yük):** Ana sayfa slider görselleri 11 adet ve her biri ~0.9–1.5 MB (toplam ~11.5 MB). Tüm webp yükü ~19.3 MB'dir. `scripts/slider.js` içindeki `preloadImages()` sayfa açılışından 1 sn sonra tüm slaytları indirir.
* **Öne çıkan öneriler:**
  1. Görselleri gerçek kullanım boyutuna küçültüp kalite ~%70–75'te yeniden webp olarak dışa aktar (11.5 MB → ~2 MB).
  2. `styles/main.css` içindeki `@import` zincirini tek birleştirilmiş/minify CSS'e çevir (render-blocking azalır).
  3. OpenLayers (~700 KB) yalnızca `#contact` sayfasında lazy yüklensin.
  4. Kullanılmayan ham `images/blogs/blog jpg/*.jpg` kopyalarını ayıkla.
* **`performans-demo.html`:** Slider'ı hafifletmek için iki yaklaşımın — A: tamamen görselsiz içerik slaytı, B: sıkıştırılmış görsel + HTML metin kartı — **yan yana görsel karşılaştırma** demosu. Geçici ve bağımsız bir dosyadır; karar sonrası `data/slides.js` ve `scripts/slider.js` bu yönde güncellenir.
```