/* Interactive, illustrative pathogen trend chart. No quantitative measurements are implied. */
var PathogenChart = (function () {
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var instanceId = 0;
  var series = [
    {
      id: 'chemical',
      label: 'Geleneksel kimyasallar',
      color: '#dc3f43',
      points: [
        'Başlangıç: Patojenler normal seviyenin üzerinde.',
        '1. Saat: Kimyasal kurur, koruyucu flora yok edildiği için koruma biter.',
        '12. Saat: Rekabetsiz ortamda patojenler katlanarak çoğalır (Sıçrama).',
        '24. Saat: Kritik seviye aşıldı! Süper bakteriler (AMR) zırh oluşturur.',
        '48. Saat: Yüzey sürekli bulaş kaynağı olmaya devam eder.',
        '72. Saat: Temizlik yapılmadıkça patojen yoğunluğu düşmez.'
      ],
      coordinates: [210, 330, 200, 85, 90, 95]
    },
    {
      id: 'probiotic',
      label: 'Probiyotik koruma',
      color: '#13875c',
      points: [
        'Başlangıç: Probiyotikler ortama bırakılır.',
        '1. Saat: Probiyotikler uyanır, biyofilm tabakasına yerleşir.',
        '12. Saat: Organik besinler tüketilir, patojenler aç bırakılarak elenir.',
        "24. Saat: Patojen seviyesi tamamen 'Normal' seviyeye indirilir.",
        '48. Saat: Canlı mikrobiyom tabakası korumaya devam eder.',
        '72. Saat: 3 gün boyunca sıfır kimyasal kalıntı ve tam koruma!'
      ],
      coordinates: [210, 220, 280, 330, 335, 335]
    }
  ];

  function svgElement(name, attributes, text) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attributes || {}).forEach(function (key) {
      node.setAttribute(key, attributes[key]);
    });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function initPathogenChart(root) {
    if (!root || typeof root.querySelector !== 'function') return { destroy: function () {} };
    var host = root.matches && root.matches('[data-pathogen-chart]')
      ? root
      : root.querySelector('[data-pathogen-chart]');
    if (!host) return { destroy: function () {} };

    var id = ++instanceId;
    var cleanupTasks = [];
    var selectedPoint = null;
    var hoveredPoint = null;
    var defaultMessage = 'Bir nokta seçin veya üzerine gelin.';
    var chart = document.createElement('div');
    chart.className = 'pathogen-chart';
    chart.setAttribute('data-pathogen-chart-instance', String(id));

    var controls = document.createElement('div');
    controls.className = 'pathogen-chart__filters';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Grafikte gösterilecek seriler');
    var allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.className = 'pathogen-chart__filter';
    allButton.textContent = 'Tümü';
    allButton.setAttribute('aria-pressed', 'true');
    controls.appendChild(allButton);
    var detail = document.createElement('div');
    detail.className = 'pathogen-chart__detail';
    detail.setAttribute('role', 'status');
    detail.setAttribute('aria-live', 'polite');
    detail.setAttribute('aria-atomic', 'true');
    detail.textContent = defaultMessage;

    var svg = svgElement('svg', {
      class: 'pathogen-chart__svg graphpanel',
      viewBox: '0 0 780 410',
      role: 'group',
      'aria-labelledby': 'pathogen-title-' + id + ' pathogen-desc-' + id,
      preserveAspectRatio: 'xMidYMid meet'
    });
    svg.appendChild(svgElement('title', { id: 'pathogen-title-' + id }, 'Patojen seviyesi trendi'));
    svg.appendChild(svgElement('desc', { id: 'pathogen-desc-' + id }, 'Zaman içinde iki temsili eğri. Dikey eksen sayısal ölçüm değil, Normal, Orta ve Kritik seviyelerini gösterir.'));

    var defs = svgElement('defs');
    series.forEach(function (item) {
      var gradient = svgElement('linearGradient', { id: 'pathogen-fill-' + id + '-' + item.id, x1: '0', y1: '0', x2: '0', y2: '1' });
      gradient.appendChild(svgElement('stop', { offset: '0%', 'stop-color': item.color, 'stop-opacity': '0.24' }));
      gradient.appendChild(svgElement('stop', { offset: '100%', 'stop-color': item.color, 'stop-opacity': '0.015' }));
      defs.appendChild(gradient);
    });
    svg.appendChild(defs);

    var xPositions = [110, 225, 350, 475, 600, 725];
    var yPositions = [67, 181, 295];
    var xLabels = ['0', '1', '12', '24', '48', '72'];
    yPositions.forEach(function (y, index) {
      svg.appendChild(svgElement('line', {
        x1: 96, y1: y, x2: 742, y2: y,
        class: 'pathogen-chart__grid'
      }));
      svg.appendChild(svgElement('text', {
        x: 84, y: y + 5,
        class: 'pathogen-chart__axis-label pathogen-chart__axis-label--y',
        'text-anchor': 'end'
      }, ['Kritik', 'Orta', 'Normal'][index]));
    });
    svg.appendChild(svgElement('line', { x1: 96, y1: 48, x2: 96, y2: 314, class: 'pathogen-chart__axis' }));
    svg.appendChild(svgElement('line', { x1: 96, y1: 314, x2: 742, y2: 314, class: 'pathogen-chart__axis' }));
    xPositions.forEach(function (x, index) {
      svg.appendChild(svgElement('line', { x1: x, y1: 314, x2: x, y2: 321, class: 'pathogen-chart__axis' }));
      svg.appendChild(svgElement('text', {
        x: x, y: 344,
        class: 'pathogen-chart__axis-label pathogen-chart__axis-label--x',
        'text-anchor': 'middle'
      }, xLabels[index]));
    });

    svg.appendChild(svgElement('text', {
      x: 420, y: 386, class: 'pathogen-chart__axis-label pathogen-chart__axis-label--x',
      'text-anchor': 'middle'
    }, 'Süre (saat)'));

    var pointNodes = [];
    var groups = {};
    var filterButtons = {};
    var allVisible = true;
    var onShowAll = function () {
      allVisible = true;
      series.forEach(function (item) {
        groups[item.id].setAttribute('data-visible', 'true');
        groups[item.id].style.display = '';
        filterButtons[item.id].setAttribute('aria-pressed', 'true');
      });
      allButton.setAttribute('aria-pressed', 'true');
    };
    allButton.addEventListener('click', onShowAll);
    cleanupTasks.push(function () { allButton.removeEventListener('click', onShowAll); });

    series.forEach(function (item) {
      var group = svgElement('g', {
        class: 'pathogen-chart__series pathogen-chart__series--' + item.id,
        'data-series': item.id
      });
      groups[item.id] = group;
      group.appendChild(svgElement('path', {
        d: buildArea(item.coordinates, xPositions, 314),
        class: 'pathogen-chart__area',
        fill: 'url(#pathogen-fill-' + id + '-' + item.id + ')'
      }));
      group.appendChild(svgElement('path', {
        d: buildPath(item.coordinates, xPositions),
        class: 'pathogen-chart__line',
        stroke: item.color
      }));
      var legend = document.createElement('button');
      legend.type = 'button';
      legend.className = 'pathogen-chart__filter';
      legend.setAttribute('data-filter', item.id);
      legend.setAttribute('aria-pressed', 'true');
      legend.innerHTML = '<span class="pathogen-chart__swatch" aria-hidden="true"></span>' + item.label;
      legend.querySelector('.pathogen-chart__swatch').style.backgroundColor = item.color;
      filterButtons[item.id] = legend;
      controls.appendChild(legend);
      var onToggle = function () {
        var isVisible = group.getAttribute('data-visible') !== 'false';
        group.setAttribute('data-visible', isVisible ? 'false' : 'true');
        group.style.display = isVisible ? 'none' : '';
        legend.setAttribute('aria-pressed', isVisible ? 'false' : 'true');
        allVisible = series.every(function (candidate) {
          return groups[candidate.id].getAttribute('data-visible') !== 'false';
        });
        allButton.setAttribute('aria-pressed', allVisible ? 'true' : 'false');
        if (selectedPoint && selectedPoint.series === item.id && isVisible) {
          selectedPoint = null;
          updateDetail(null);
        }
      };
      legend.addEventListener('click', onToggle);
      cleanupTasks.push(function () { legend.removeEventListener('click', onToggle); });

      item.coordinates.forEach(function (value, index) {
        var y = scaleY(item.coordinates[index]);
        var point = svgElement('circle', {
          cx: xPositions[index],
          cy: y,
          r: 6.5,
          class: 'pathogen-chart__point point-interactive filterpoints',
          fill: item.color,
          tabindex: '0',
          role: 'button',
          'aria-label': item.label + ', ' + (index === 0 ? 'Başlangıç' : xLabels[index] + ' Saat') + '. ' + item.points[index],
          'aria-pressed': 'false',
          'data-series': item.id,
          'data-index': String(index)
        });
        var pointInfo = { node: point, series: item.id, index: index };
        var onEnter = function () { hoveredPoint = pointInfo; updateDetail(pointInfo); };
        var onLeave = function () {
          hoveredPoint = null;
          updateDetail(selectedPoint);
        };
        var onSelect = function () { selectedPoint = pointInfo; updateDetail(pointInfo); };
        var onKeySelect = function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect();
          }
        };
        var onTouchSelect = function (event) {
          if (event.pointerType === 'touch') onSelect();
        };
        point.addEventListener('pointerenter', onEnter);
        point.addEventListener('pointerleave', onLeave);
        point.addEventListener('focus', onSelect);
        point.addEventListener('click', onSelect);
        point.addEventListener('keydown', onKeySelect);
        point.addEventListener('pointerup', onTouchSelect);
        cleanupTasks.push(function () {
          point.removeEventListener('pointerenter', onEnter);
          point.removeEventListener('pointerleave', onLeave);
          point.removeEventListener('focus', onSelect);
          point.removeEventListener('click', onSelect);
          point.removeEventListener('keydown', onKeySelect);
          point.removeEventListener('pointerup', onTouchSelect);
        });
        pointNodes.push(pointInfo);
        group.appendChild(point);
      });
      svg.appendChild(group);
    });

    chart.appendChild(controls);
    chart.appendChild(svg);
    chart.appendChild(detail);
    host.appendChild(chart);

    function updateDetail(pointInfo) {
      pointNodes.forEach(function (point) {
        point.node.classList.toggle('is-selected', pointInfo === point);
        point.node.classList.toggle('is-hovered', hoveredPoint === point);
        point.node.setAttribute('aria-pressed', pointInfo === point ? 'true' : 'false');
      });
      if (!pointInfo) {
        detail.textContent = defaultMessage;
        return;
      }
      var item = series.find(function (candidate) { return candidate.id === pointInfo.series; });
        detail.textContent = item.label + ' · ' + item.points[pointInfo.index];
    }

    function scaleY(originalCoordinate) {
      // The original diagram supplies shape coordinates, not measured values.
      return 48 + ((originalCoordinate - 70) / 280) * 266;
    }

    function buildPath(originalCoordinates, x) {
      var coords = originalCoordinates.map(function (coordinate, index) {
        return { x: x[index], y: scaleY(coordinate) };
      });
      return smoothPath(coords);
    }

    function buildArea(originalCoordinates, x, baseline) {
      var coords = originalCoordinates.map(function (coordinate, index) {
        return { x: x[index], y: scaleY(coordinate) };
      });
      return smoothPath(coords) + ' L ' + coords[coords.length - 1].x + ' ' + baseline + ' L ' + coords[0].x + ' ' + baseline + ' Z';
    }

    function smoothPath(coords) {
      if (!coords.length) return '';
      var path = 'M ' + coords[0].x + ' ' + coords[0].y;
      for (var index = 0; index < coords.length - 1; index++) {
        var current = coords[index];
        var next = coords[index + 1];
        var midpoint = (current.x + next.x) / 2;
        path += ' C ' + midpoint + ' ' + current.y + ', ' + midpoint + ' ' + next.y + ', ' + next.x + ' ' + next.y;
      }
      return path;
    }

    return {
      destroy: function () {
        cleanupTasks.forEach(function (cleanup) { cleanup(); });
        if (chart.parentNode === host) host.removeChild(chart);
        pointNodes = [];
        selectedPoint = null;
        hoveredPoint = null;
      }
    };
  }

  return { init: initPathogenChart };
})();

function initPathogenChart(root) {
  return PathogenChart.init(root);
}
