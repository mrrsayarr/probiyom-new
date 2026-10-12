# SEO yayını

İçerik kaynakları `data/` ve `pages/` altında kalır. Hazır HTML dosyalarını elle düzenlemeyin.

1. İlk kurulum: `npm install`, ardından `npx playwright install chromium`.
2. Her içerik değişikliğinden sonra `npm run build` çalıştırın. Chrome kuruluysa Chromium yerine `CHROME_CHANNEL=chrome` ortam değişkeni kullanılabilir.
3. `dist/` yayın paketidir. Kaynak klasörü yerine bu paketi yayınlayın. Cloudflare Workers için kökteki `wrangler.jsonc` ve `scripts/seo-worker.mjs` kullanılır; derlemeden sonra normal yayın komutunuzla ilerleyin. Otomatik yayın yapılmaz.
4. Yerelde `python serve.py 7076` kullanın. Sunucu `seo-pages/` HTML dosyalarını temiz URL'lerinde verir; bilinmeyen rotalar gerçek HTTP 404 döndürür. Apache için `dist/.htaccess`, nginx için `nginx-probiyom.conf` içindeki `root` yolunu yayınlanan `dist/` konumuna ayarlayın.
5. Kontrol: `node tests/seo.browser.cjs`, `node --test tests/seo-worker.test.mjs`, `python -m unittest discover -s tests -p test_serve.py`. Yayından sonra Search Console'da sitemap gönderin ve bir blog URL'sinin canlı testini çalıştırın.

Derleme rotaları güncel sayfa kaydı, ürün grupları ve blog verisinden oluşturur. Sitemap otomatik yenilenir. Eski `/#blog/...` bağlantıları tarayıcıda temiz adrese dönüşmeye devam eder; `#` sunucuya gönderilmediği için bu geçiş tarayıcıda yapılır.

Blogların gerçek yayın/güncelleme tarihleri biliniyorsa `data/blogs.js` kayıtlarına `datePublished` ve `dateModified` ekleyin (`YYYY-MM-DD` veya ISO tarih-saat). Bilinmeyen tarihler yapılandırılmış veriden çıkarılır; derleme tarihi yayın tarihi olarak yazılmaz.

`seo-pages/manifest.json` yayınlanan rotaların tek listesidir. HTML tüm kullanıcılara aynı şekilde sunulur; bot tespiti yapılmaz. Etkileşimli slider, grafik, form ve harita JavaScript ile çalışmaya devam eder.
