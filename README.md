# Probiyom

## Yerel önizleme

Node.js kurulu olmalıdır. Bu klasörde terminal açıp `npm start` çalıştırın.
Adres: http://localhost:7076/ — kapatmak için Ctrl+C.

Önizleme için tek dosya `serve.mjs`; Python veya ek paket gerekmez.
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
