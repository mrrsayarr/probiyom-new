var SLIDER_DURATION_MS = 4000;

// Selected by the original 12-slide counter: 1 → 11 → 2 → 3 → 9 → 6 → 8.
var homeSlides = [
  {
    "src": "images/homepage_sliders/hp_1.webp",
    "alt": "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    "title": ""
  },
  {
    "src": "images/homepage_sliders/hp_10.webp",
    "alt": "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    "title": ""
  },
  {
    "src": "images/homepage_sliders/hp_2.webp",
    "alt": "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    "title": ""
  },
  {
    "src": "images/homepage_sliders/hp_3.webp",
    "alt": "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    "title": ""
  },
  {
    "src": "images/homepage_sliders/hp_8.webp",
    "alt": "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    "title": ""
  },
  {
    "src": "images/homepage_sliders/hp_5.webp",
    "alt": "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    "title": ""
  },
  {
    "src": "images/homepage_sliders/hp_7.webp",
    "alt": "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    "title": ""
  }
];

(function () {
  if (typeof window === 'undefined') return;
  // Sadece ilk görseli ön yükle (LCP için kritik)
  if (homeSlides[0] && homeSlides[0].src) {
    var img = new Image();
    img.src = homeSlides[0].src;
  }
  // Diğer görseller sayfa etkileşimine kadar ertelenir
})();