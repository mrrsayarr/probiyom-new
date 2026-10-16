/* ===================================================================
   ImageSlider – GPU-Accelerated Dynamic Sliding Carousel
   =================================================================== */

function ImageSlider(container, slides, durationMs, options) {
  if (!slides || slides.length === 0) return;
  options = options || {};
  durationMs = durationMs || 7000; // Slayt geçiş hızı 7 saniye

  var activeIndex = 0;
  var timer = null;
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isPaused = !!prefersReducedMotion;
  var slideElements = [];
  var pauseBtn = null;
  var counterSpan = null;
  var progressBar = null;
  var destroyed = false;
  var navigationVersion = 0;

  function init() {
    var wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper';
    if (options.controls === 'top-right') wrapper.classList.add('slider-wrapper--controls-top-right');
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-roledescription', 'slayt gösterisi');
    wrapper.setAttribute('aria-label', options.label || 'Görsel slaytlar');

    var frame = document.createElement('div');
    frame.className = 'slider-frame';

    var track = document.createElement('div');
    track.className = 'slider-track';

    slides.forEach(function (slide, index) {
      var slideDiv = document.createElement('div');
      slideDiv.className = 'slider-slide' + (index === 0 ? ' is-active' : '');
      slideDiv.setAttribute('role', 'group');
      slideDiv.setAttribute('aria-label', (index + 1) + ' / ' + slides.length);

      var imageContainer = document.createElement('div');
      imageContainer.className = 'slider-image-container';
      var image = document.createElement('img');
      image.setAttribute('data-src', slide.src);
      image.alt = slide.alt || '';
      image.loading = index === 0 ? 'eager' : 'lazy';
      image.decoding = 'async';
      if (index === 0) image.setAttribute('fetchpriority', 'high');
      if (index === 0) setResponsiveImage(image, slide.src, '(max-width: 575px) 100vw, (max-width: 1440px) 84vw, 1140px');
      imageContainer.appendChild(image);

      // AKILLI KONTROL: Sadece başlık verisi (title) dolu olan slaytlara metin kutusu ekler
      var content = document.createDocumentFragment();
      content.appendChild(imageContainer);
      if (slide.title && slide.title.trim().length > 0) {
        var title = document.createElement('div');
        title.className = 'slider-title';
        var titleText = document.createElement('p');
        titleText.textContent = slide.title;
        title.appendChild(titleText);
        content.appendChild(title);
      }
      if (slide.link) {
        var link = document.createElement('a');
        link.href = slide.link;
        link.appendChild(content);
        slideDiv.appendChild(link);
      } else {
        slideDiv.appendChild(content);
      }

      track.appendChild(slideDiv);
      slideElements.push(slideDiv);
    });

    frame.appendChild(track);

    // Otomatik Slayt Geçiş Çizgisi (Progress Bar)
    if (slides.length > 1) {
      progressBar = document.createElement('div');
      progressBar.className = 'slider-progress-bar';
      frame.appendChild(progressBar);
    }

    wrapper.appendChild(frame);

    // Birleşik Cam Kontrol Paneli (Control Dock)
    if (slides.length > 1) {
      var dockContainer = document.createElement('div');
      dockContainer.className = 'slider-dock-container d-flex justify-content-center' +
        (options.controls === 'top-right' ? '' : ' mt-3');

      var controlDock = document.createElement('div');
      controlDock.className = 'slider-control-dock';

      // Önceki Butonu
      var prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'dock-btn dock-btn-prev';
      prevBtn.setAttribute('aria-label', 'Önceki slayt');
      prevBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
      prevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        goTo((activeIndex - 1 + slides.length) % slides.length);
      });

      // Dinamik Sayfa Numarası
      counterSpan = document.createElement('span');
      counterSpan.className = 'dock-counter';

      // Sonraki Butonu
      var nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'dock-btn dock-btn-next';
      nextBtn.setAttribute('aria-label', 'Sonraki slayt');
      nextBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
      nextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        goTo((activeIndex + 1) % slides.length);
      });

      // Duraklat / Başlat Butonu
      pauseBtn = document.createElement('button');
      pauseBtn.type = 'button';
      pauseBtn.className = 'dock-btn dock-btn-pause';
      updatePauseButton();
      pauseBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        togglePause();
      });

      controlDock.appendChild(prevBtn);
      controlDock.appendChild(counterSpan);
      controlDock.appendChild(nextBtn);
      controlDock.appendChild(pauseBtn);

      dockContainer.appendChild(controlDock);
      wrapper.appendChild(dockContainer);
    }

    container.innerHTML = '';
    container.appendChild(wrapper);
    
    updateDOM();
  }

  function updatePauseButton() {
    if (!pauseBtn) return;
    var pauseIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>';
    var playIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"></path></svg>';
    
    pauseBtn.setAttribute('aria-label', isPaused ? 'Slaytı devam ettir' : 'Slaytı duraklat');
    pauseBtn.innerHTML = isPaused ? playIcon : pauseIcon;
  }

  function padZero(num) {
    return num < 10 ? '0' + num : num;
  }

  function preloadNextSlide(currentIdx) {
    if (!slides || slides.length <= 1) return;
    var nextIdx = (currentIdx + 1) % slides.length;
    var nextSlide = slides[nextIdx];
    if (nextSlide && nextSlide.src) {
      var img = slideElements[nextIdx].querySelector('img');
      if (!img.getAttribute('src')) {
        img.loading = 'eager';
        img.setAttribute('fetchpriority', 'low');
        setResponsiveImage(img, nextSlide.src, '(max-width: 575px) 100vw, (max-width: 1440px) 84vw, 1140px');
      }
    }
  }

  function updateDOM() {
    slideElements.forEach(function (slide, idx) {
      if (idx === activeIndex) {
        slide.classList.add('is-active');
        slide.removeAttribute('inert');
        slide.setAttribute('aria-hidden', 'false');
      } else {
        slide.classList.remove('is-active');
        slide.setAttribute('inert', '');
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    var track = container.querySelector('.slider-track');
    if (track) {
      track.style.transform = 'translateX(-' + (activeIndex * 100) + '%)';
    }

    if (counterSpan) {
      counterSpan.textContent = padZero(activeIndex + 1) + ' / ' + padZero(slides.length);
    }

    if (progressBar) {
      progressBar.style.animationDuration = durationMs + 'ms';
      var replacement = progressBar.cloneNode(false);
      progressBar.replaceWith(replacement);
      progressBar = replacement;
      progressBar.classList.remove('is-animating');
      
      if (!isPaused) {
        progressBar.classList.add('is-animating');
        progressBar.style.animationPlayState = 'running';
      } else {
        progressBar.style.animationPlayState = 'paused';
      }
    }

  }

  function togglePause() {
    if (destroyed) return;
    isPaused = !isPaused;
    if (isPaused) {
      clearTimeout(timer);
      timer = null;
      if (progressBar) {
        progressBar.style.animationPlayState = 'paused';
      }
    } else {
      scheduleNext();
      if (progressBar) {
        progressBar.classList.add('is-animating');
        progressBar.style.animationPlayState = 'running';
      }
    }
    updatePauseButton();
  }

  function goTo(idx) {
    if (destroyed) return;
    clearTimeout(timer);
    timer = null;
    var version = ++navigationVersion;
    var image = slideElements[idx].querySelector('img');
    image.loading = 'eager';
    image.setAttribute('fetchpriority', 'high');
    if (!image.getAttribute('src')) setResponsiveImage(image, slides[idx].src, '(max-width: 575px) 100vw, (max-width: 1440px) 84vw, 1140px');
    function commit() {
      if (destroyed || version !== navigationVersion) return;
      activeIndex = idx;
      updateDOM();
      if (!isPaused) scheduleNext();
    }
    if (!image.complete && image.decode) image.decode().catch(function () {}).then(commit);
    else commit();
  }

  function scheduleNext() {
    if (destroyed) return;
    if (slides.length <= 1) return;
    if (isPaused) return;
    
    timer = setTimeout(function () {
      goTo((activeIndex + 1) % slides.length);
    }, durationMs);
  }

  init();
  var initialImage = slideElements[0].querySelector('img');
  if (initialImage.decode) initialImage.decode().catch(function () {}).then(function () {
    if (!destroyed) preloadNextSlide(0);
  });
  if (!isPaused) scheduleNext();

  return {
    destroy: function () {
      destroyed = true;
      clearTimeout(timer);
      timer = null;
    },
  };
}
