var SLIDER_DURATION_MS = 4000;

var homeSlides = [

  { // 1
    src: "images/homepage_sliders/hp_1.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 2
    src: "images/homepage_sliders/hp_2.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 3
    src: "images/homepage_sliders/hp_3.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 4.0
    src: "images/homepage_sliders/hp_4.0.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 4.1
    src: "images/homepage_sliders/hp_4.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 5
    src: "images/homepage_sliders/hp_5.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 6
    src: "images/homepage_sliders/hp_6.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 7
    src: "images/homepage_sliders/hp_7.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 8
    src: "images/homepage_sliders/hp_8.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 9
    src: "images/homepage_sliders/hp_9.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 10
    src: "images/homepage_sliders/hp_10.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
  { // 11
    src: "images/homepage_sliders/hp_11.webp",
    alt: "Probiyom, probiyotik bazlı ürünlerin çalışma şekli, mekanizması, probiyotikler nasıl çalışır, nası temzilik yapar, 72 saat canlı kalırlar",
    title: "",
  },
];

var productSlides = [
  {
    src: "images/products_sliders/ps_1.webp",
    alt: ProductGroupLabels[ProductGroup.ProfessionalCleaning],
    title: ProductGroupLabels[ProductGroup.ProfessionalCleaning],
    link: "/products/professional_cleaning",
  },
  {
    src: "images/products_sliders/ps_2.webp",
    alt: ProductGroupLabels[ProductGroup.HomeCleaning],
    title: ProductGroupLabels[ProductGroup.HomeCleaning],
    link: "/products/home_cleaning",
  },
  {
    src: "images/products_sliders/ps_3.webp",
    alt: ProductGroupLabels[ProductGroup.PersonalCare],
    title: ProductGroupLabels[ProductGroup.PersonalCare],
    link: "/products/personal_care",
  },
  {
    src: "images/products_sliders/ps_4.webp",
    alt: ProductGroupLabels[ProductGroup.ColdMistSpraying],
    title: ProductGroupLabels[ProductGroup.ColdMistSpraying],
    link: "/products/cold_mist_spraying",
  },
  {
    src: "images/products_sliders/ps_5.webp",
    alt: ProductGroupLabels[ProductGroup.ColdMistSpraying],
    title: ProductGroupLabels[ProductGroup.ColdMistSpraying],
    link: "/products/cold_mist_spraying",
  },
  {
    src: "images/products_sliders/ps_6.webp",
    alt: ProductGroupLabels[ProductGroup.IndustrialWaterTreatment],
    title: ProductGroupLabels[ProductGroup.IndustrialWaterTreatment],
    link: "/products/industrial_water_treatment",
  },
  {
    src: "images/products_sliders/ps_7.webp",
    alt: ProductGroupLabels[ProductGroup.Livestock],
    title: ProductGroupLabels[ProductGroup.Livestock],
    link: "/products/livestock",
  },
  {
    src: "images/products_sliders/ps_8.webp",
    alt: ProductGroupLabels[ProductGroup.Pet],
    title: ProductGroupLabels[ProductGroup.Pet],
    link: "/products/pet",
  }
];

// İLK AÇILIŞ GECİKMESİNİ (1 SN BEKLEMEYİ) SIFIRLAYAN ANINDA ÖN YÜKLEME
(function () {
  if (typeof window === 'undefined') return;
  [homeSlides, productSlides].forEach(function (list) {
    if (!list) return;
    list.forEach(function (s, idx) {
      if (s && s.src) {
        var img = new Image();
        img.src = s.src;
      }
    });
  });
})();
