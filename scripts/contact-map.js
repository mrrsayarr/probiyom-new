/* ===================================================================
   ContactMap – OpenLayers map with an on-brand location marker
   =================================================================== */

function ContactMap(container, lon, lat, zoom) {
  // GÜVENLİK KONTROLÜ: Eğer konteyner DOM'da henüz oluşmadıysa çökme yaşanmasını engeller.
  if (!container) {
    console.warn("ContactMap konteyneri DOM üzerinde bulunamadı.");
    return null;
  }

  zoom = zoom || 15;

  container.innerHTML =
    '<div class="map-container shadow-sm">' +
      '<div class="map-inner">' +
        '<div id="ol-map"></div>' +
      '</div>' +
    '</div>';

  var mapDiv = container.querySelector('#ol-map');

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

  var map = new ol.Map({
    target: mapDiv,
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
      /* DÜZELTİLDİ: Çökmeye sebep olan hatalı 'sidebar = null,' ataması buradan kaldırıldı */
      vectorLayer,
    ],
    view: new ol.View({
      center: center,
      zoom: zoom,
    }),
    controls: [],
  });

  /* Fix map sizing with requestAnimationFrame to prevent sizing glitches */
  requestAnimationFrame(function () {
    map.updateSize();
    requestAnimationFrame(function () {
      map.updateSize();
    });
  });

  window.addEventListener('resize', function () {
    map.updateSize();
  });

  return map;
}