# Probiyom

## Yerel önizleme

Node.js kurulu olmalıdır. İlk kullanımda `npm install`, ardından bu klasörde `npm start` çalıştırın.
`npm start`, önizlemeyi açmadan önce güncel içeriklerden otomatik build alır.
Adres: http://localhost:7076/ — kapatmak için Ctrl+C.

Önizleme sunucusu tek dosya `serve.mjs`; Python veya tarayıcı kurulumu gerekmez.
Port doluysa `node serve.mjs 7077` kullanın.

## İçerik ve yayın

- `data/`, `pages/`: metinler, ürünler, SSS ve sayfalar.
- `styles/`, `scripts/`: görünüm ve etkileşimler.
- `images/`: kullanılan görseller; `st/`: bağımsız teklif sayfası.
- `dist/`: üretilen yayın paketi; elle düzenlemeyin.

İlk derleme için `npm install`, ardından `npm run build` çalıştırın.
İçerik değişikliklerinden sonra `npm run build` ile önizleme ve yayın paketini yenileyin.
Derleme yalnızca Node.js ve HTML işleme paketi kullanır; tarayıcı indirme, Chromium, Playwright veya root yetkisi gerekmez.

Cloudflare build komutu: `npm run build`. Yayın ayarları `wrangler.jsonc`,
yönlendirmeler `scripts/seo-worker.mjs` içindedir. Eski `/#blog/...` bağlantıları,
sonunda `/` bulunan adresler, sitemap ve SEO etiketleri korunur.

Kontrol: `node serve.mjs --check`.

Trendyol duyurusu: görseli değiştirmek için `images/trendyol-popup.webp` dosyasını yenileyin. Mağaza bağlantısı ve duyuruyu açma/kapatma ayarı `data/site.js` içindedir. Duyuru her tam sayfa açılışında/yenilemede bir kez açılır; site içindeki menü geçişlerinde tekrarlanmaz.
