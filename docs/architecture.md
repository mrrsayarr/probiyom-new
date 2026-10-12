# Probiyom site yapısı

Site bağımsız HTML, CSS ve JavaScript dosyalarıyla çalışır. Yayın öncesinde `npm run build` her URL için hazır HTML ve `dist/` paketini üretir. İçerik değişiklikleri, sayfa kurulumu ve rota davranışı ayrı dosyalarda tutulur.

| Sorumluluk | Dosya |
| --- | --- |
| URL normalizasyonu ve sayfa kaydı | `scripts/site-routes.js` |
| Navigasyon, şablon önbelleği, eski hash bağlantıları | `scripts/router.js` |
| Sayfa kurulumu ve bileşen temizliği | `scripts/page-controllers.js` |
| Başlık, canonical, sosyal meta ve JSON-LD | `scripts/page-seo.js` |
| Ana sayfa bileşenlerini birleştirme | `scripts/home-page.js` |
| Ana sayfa ve katalog için ortak kategori kartları | `data/categories.js`, `scripts/category-grid.js`, `styles/category-grid.css` |
| Grafik etkileşimi | `scripts/pathogen-chart.js` |
| İçerik / şablon / görünüm | `data/`, `pages/`, `styles/` |

## Yeni sayfa ekleme

1. Şablonu `pages/` altında oluşturun; şablonların içine script eklemeyin. Router şablonları `innerHTML` ile yerleştirir.
2. `SiteRoutes.pages` içine sayfa adını ve şablon yolunu ekleyin.
3. `PageControllers` içindeki başlatıcı kaydına kurulumu ekleyin. Bileşenler `destroy()` döndürmeli; zamanlayıcılarını ve dış dinleyicilerini bu fonksiyonda kaldırmalı.
4. Gerekiyorsa `PageSEO` içinde şema ekleyin; `sitemap.xml` ve `llms.txt` dosyalarını güncelleyin.
5. Değişen dosyaların `index.html` sürüm eklerini yenileyin; ilgili testleri çalıştırın.

## Yaşam döngüsü sözleşmesi

Her rota değişiminde önce eski sayfanın bileşenleri temizlenir. Bekleyen şablon yanıtı yalnız hâlâ güncel rota sürümüne aitse ekrana yerleştirilir. Aynı şablon için eş zamanlı istekler paylaşılır; başarısız istek önbelleğe alınmaz ve yeniden denenebilir. Tamamlanan navigasyon `routechange` olayını gönderir.

`ImageSlider(container, slides, durationMs, options)` varsayılan olarak alt kontrolleri kullanır. Ana sayfa `{ controls: 'top-right' }` seçeneğini açıkça geçirir; kontroller görselin üzerinde, kenarlardan boşluk bırakarak yerleşir. Başka sliderların konumu bu seçenekten etkilenmez. İlk görsel öncelikli, takip eden görsel önceden yüklenir; tüm galeriyi zorla indiren döngü kaldırılmıştır.

Ana sayfa slaytları `data/slides.js` içindedir. Seçilen sıra, ilk 12 slaytlık galerinin sayaç numaralarıyla **1 → 11 → 2 → 3 → 9 → 6 → 8** şeklindedir. Bu nedenle dosya sırası `hp_1`, `hp_10`, `hp_2`, `hp_3`, `hp_8`, `hp_5`, `hp_7` olur; güncel sayaç 1–7 arasında ilerler.

Grafik eğrileri temsili anlatımdır, ölçüm verisi değildir. Yeni bilimsel iddia ya da ölçüm eklenirken kaynak verisi ayrıca sağlanmalıdır.

Kategori başlıkları, kullanım alanı fotoğrafları ve açıklamaları `data/categories.js` içinden güncellenir. Ana sayfa ve `/products`, `[data-category-grid]` hedeflerini aynı `CategoryGrid` bileşeniyle doldurur; kartları şablonlara ayrı ayrı kopyalamayın.

## Doğrulama

- `node --test tests/*.test.cjs`: rota, yaşam döngüsü, güvenli blog gösterimi, SSS ve grafik davranışı.
- `node tests/browser.cjs`: tüm rotalar, masaüstü/mobil, iletişim ve erişilebilirlik kontrolleri.
- `node tests/home.browser.cjs`: ana sayfa sıralaması, kontrol konumu, grafik etkileşimi ve kategori görselleri.
- `python -m unittest discover -s tests -p test_serve.py`: statik dosyalar ve bağımsız teklif sayfası.

Yerel önizleme `python serve.py 7076` ile açılır. Canlı hosting `dist/` içindeki hazır sayfaları temiz URL'lerinde sunar; bilinmeyen rotalarda HTTP 404 verir. `/st/` bağımsız belgedir. Derleme ve yayın adımları `docs/seo-build.md` içinde açıklanır.
