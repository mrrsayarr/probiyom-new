/* Homepage composition. Components own their listeners and timers. */
var HomePage = (function () {
  function mount(root) {
    var resources = [];
    // Decorative backgrounds below the fold need not compete with the opening images.
    var backgrounds = root.querySelectorAll('[data-background]');
    function loadBackground(element) {
      element.style.backgroundImage = 'url("' + element.getAttribute('data-background') + '")';
    }
    if (window.IntersectionObserver) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          loadBackground(entry.target);
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '300px' });
      backgrounds.forEach(function (element) { observer.observe(element); });
      resources.push({ destroy: function () { observer.disconnect(); } });
    } else if (typeof navigator !== 'undefined') {
      backgrounds.forEach(loadBackground);
    }
    CategoryGrid(root.querySelector('[data-category-grid]'));
    var slider = root.querySelector('#home-slider');
    if (slider) resources.push(ImageSlider(slider, homeSlides, SLIDER_DURATION_MS, {
      controls: 'top-right',
      label: 'Probiyotik temizlik teknolojisi'
    }));
    var chart = root.querySelector('[data-pathogen-chart]');
    if (chart) resources.push(initPathogenChart(root));
    return {
      destroy: function () {
        resources.splice(0).forEach(function (resource) {
          if (resource && resource.destroy) resource.destroy();
        });
      }
    };
  }
  return { mount: mount };
})();
