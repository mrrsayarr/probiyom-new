/* ===================================================================
   ContactMap – OpenLayers map with an on-brand location marker
   Lazy-loads OpenLayers only when contact page is visited
   =================================================================== */

function ContactMap(container, lon, lat, zoom) {
  // GÜVENLİK KONTROLÜ: Eğer konteyner DOM'da henüz oluşmadıysa çökme yaşanmasını engeller.
  if (!container) {
    console.warn("ContactMap konteyneri DOM üzerinde bulunamadı.");
    return null;
  }

  zoom = zoom === undefined ? 15 : zoom;
  var map = null;
  var disposed = false;
  function updateSize() { if (map && !disposed) map.updateSize(); }
  function showError() {
    if (disposed || !container.isConnected) return;
    container.innerHTML = '<p class="p-4" role="status">Harita yüklenemedi. Konum bilgisi için yan taraftaki adresi kullanabilirsiniz.</p>';
  }

  container.innerHTML =
    '<div class="map-container shadow-sm">' +
      '<div class="map-inner">' +
        '<div id="ol-map"></div>' +
      '</div>' +
    '</div>';

  var mapDiv = container.querySelector('#ol-map');

  // Lazy load OpenLayers
  if (window.loadOpenLayers) {
    window.loadOpenLayers().then(function() {
      initMap();
    }).catch(showError);
  } else {
    try { initMap(); } catch (error) { showError(); }
  }

  function initMap() {
    if (disposed || !container.isConnected) return;
    var center = ol.proj.fromLonLat([lon, lat]);

    var markerFeature = new ol.Feature({
      geometry: new ol.geom.Point(center),
    });

    markerFeature.setStyle(
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: 10,
          fill: new ol.style.Fill({ color: '#0296f8' }), // Baltic Blue rengiyle uyumlu marker
          stroke: new ol.style.Stroke({ color: '#000000', width: 2.5 }),
        }),
      })
    );

    var vectorLayer = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [markerFeature],
      }),
    });

    map = new ol.Map({
      target: mapDiv,
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM(),
        }),
        vectorLayer,
      ],
      view: new ol.View({
        center: center,
        zoom: zoom,
      }),
    });

    /* Fix map sizing with requestAnimationFrame to prevent sizing glitches */
    requestAnimationFrame(function () {
      updateSize();
      requestAnimationFrame(function () {
        updateSize();
      });
    });

    window.addEventListener('resize', updateSize);

    return map;
  }

  return {
    destroy: function () {
      disposed = true;
      window.removeEventListener('resize', updateSize);
      if (map) { map.setTarget(null); map.dispose(); map = null; }
    }
  };
}
