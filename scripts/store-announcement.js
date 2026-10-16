/* One announcement per page load. Store details live in data/site.js. */
var StoreAnnouncement = (function () {
  var initialized = false;
  var shown = false;
  var announcementImage;

  function init() {
    if (initialized || !SiteData.storeAnnouncement || !SiteData.storeAnnouncement.enabled) return;
    initialized = true;
    announcementImage = new Image(1122, 1402);
    announcementImage.alt = SiteData.storeAnnouncement.imageAlt;
    announcementImage.fetchPriority = 'high';
    setResponsiveImage(announcementImage, SiteData.storeAnnouncement.image, '(max-width: 639px) calc(100vw - 32px), 410px');
    Promise.all([
      new Promise(function (resolve) { setTimeout(resolve, 250); }),
      announcementImage.decode().catch(function () { /* Keep the store link available if the image fails. */ })
    ]).then(show);
  }

  function show() {
    if (shown) return;
    if (document.visibilityState === 'hidden' || document.querySelector('dialog[open], .contact-modal-overlay.is-visible, #app-loader')) {
      setTimeout(show, 1000);
      return;
    }
    var opener = document.activeElement;
    var previousOverflow = document.body.style.overflow;
    var dialog = document.createElement('dialog');
    dialog.className = 'store-announcement';
    dialog.setAttribute('aria-labelledby', 'store-announcement-title');
    dialog.innerHTML =
      '<button type="button" class="store-announcement__close" aria-label="Duyuruyu kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>' +
      '<div class="store-announcement__layout">' +
        '<div class="store-announcement__visual"></div>' +
        '<div class="store-announcement__content">' +
          '<span class="store-announcement__brand">Probiyom × Trendyol</span>' +
          '<h2 id="store-announcement-title">Trendyol mağazamız açıldı.</h2>' +
          '<p>Probiyom ürünlerini artık Trendyol mağazamızdan da inceleyebilir ve sipariş verebilirsiniz.</p>' +
          '<a class="store-announcement__link" href="' + escapeAttr(SiteData.trendyol) + '" target="_blank" rel="noopener noreferrer">Trendyol mağazamızı keşfet <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>' +
          '<button type="button" class="store-announcement__continue">Siteye devam et</button>' +
        '</div>' +
      '</div>';
    if (announcementImage.naturalWidth) {
      dialog.querySelector('.store-announcement__visual').appendChild(announcementImage);
    } else {
      dialog.querySelector('.store-announcement__visual').remove();
      dialog.querySelector('.store-announcement__layout').style.gridTemplateColumns = '1fr';
    }
    function close() { dialog.close(); }
    dialog.querySelector('.store-announcement__close').addEventListener('click', close);
    dialog.querySelector('.store-announcement__continue').addEventListener('click', close);
    dialog.querySelector('.store-announcement__link').addEventListener('click', close);
    dialog.addEventListener('click', function (event) {
      var bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) close();
    });
    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      var items = dialog.querySelectorAll('button, a[href]');
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.addEventListener('close', function () {
      document.body.style.overflow = previousOverflow;
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
      dialog.remove();
    }, { once: true });
    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.querySelector('.store-announcement__close').focus({ preventScroll: true });
    document.body.style.overflow = 'hidden';
    shown = true;
  }

  return { init: init };
})();
