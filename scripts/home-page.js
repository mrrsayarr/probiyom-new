/* Homepage composition. Components own their listeners and timers. */
var HomePage = (function () {
  function mount(root) {
    var resources = [];
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
