var SLIDER_DURATION_MS = 7000;

var homeSlides = [
  {
    src: "images/homepage_sliders/hp_1.webp",
    alt: "Probiyom HeiQ VivoTech probiyotik temizlik teknolojisi - 72 saat kalıcı biyolojik hijyen",
    title: "",
  },
  {
    src: "images/homepage_sliders/hp_2.webp",
    alt: "Probiyom sinbiyotik teknoloji - doğal probiyotik ve prebiyotik bileşimi ile sürdürülebilir temizlik",
    title: "",
  },
  {
    src: "images/homepage_sliders/hp_3.webp",
    alt: "Probiyom biyofilm parçalama teknolojisi - mikroskobik düzeyde derinlemesine organik kir temizliği",
    title: "",
  },
];

var productSlides = [
  {
    src: "images/products_pages/pp_1.webp",
    alt: "Profesyonel Temizlik Ürünleri",
    title: "Profesyonel Temizlik Ürünleri",
    link: "/products/professional_cleaning",
  },
  {
    src: "images/products_pages/pp_2.webp",
    alt: "Ev Temizlik Ürünleri",
    title: "Ev Temizlik Ürünleri",
    link: "/products/home_cleaning",
  },
  {
    src: "images/products_pages/pp_3.webp",
    alt: "Kişisel Bakım Ürünleri",
    title: "Kişisel Bakım Ürünleri",
    link: "/products/personal_care",
  },
  {
    src: "images/products_pages/pp_4.webp",
    alt: "Soğuk Sis ve Püskürtme Ürünleri",
    title: "Soğuk Sis ve Püskürtme Ürünleri",
    link: "/products/cold_mist_spraying",
  },
  {
    src: "images/products_pages/pp_5.webp",
    alt: "Endüstriyel Su Arıtma Ürünleri",
    title: "Endüstriyel Su Arıtma Ürünleri",
    link: "/products/industrial_water_treatment",
  },
  {
    src: "images/products_pages/pp_6.webp",
    alt: "Hayvancılık Ürünleri",
    title: "Hayvancılık Ürünleri",
    link: "/products/livestock",
  },
  {
    src: "images/products_pages/pp_7.webp",
    alt: "PET Ürünleri",
    title: "PET Ürünleri",
    link: "/products/pet",
  }
];


// Performans optimizasyonu: Sadece ilk slayt (LCP) için eager preload, diğerleri lazy
(function () {
  if (typeof window === 'undefined') return;
  // Sadece ilk görseli ön yükle (LCP için kritik)
  if (homeSlides[0] && homeSlides[0].src) {
    var img = new Image();
    img.src = homeSlides[0].src;
  }
  if (productSlides[0] && productSlides[0].src) {
    var img2 = new Image();
    img2.src = productSlides[0].src;
  }
  // Diğer görseller sayfa etkileşimine kadar ertelenir
})();