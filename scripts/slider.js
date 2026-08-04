/* ===================================================================
   ImageSlider – GPU-Accelerated Dynamic Sliding Carousel
   =================================================================== */

function ImageSlider(container, slides, durationMs) {
  if (!slides || slides.length === 0) return;
  durationMs = durationMs || 7000; // Slayt geçiş hızı 7 saniye

  var activeIndex = 0;
  var timer = null;
  var isPaused = false;
  var slideElements = [];
  var pauseBtn = null;
  var counterSpan = null;
  var progressBar = null;

  // HIZ OPTİMİZASYONU: Görselleri slider başlatılır başlatılmaz arka planda önbelleğe çeker
  function preloadImages() {
    slides.forEach(function (slide, idx) {
      if (slide && slide.src) {
        var img = new Image();
        img.src = slide.src;
      }
    });
  }

  function init() {
    var wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper';

    var frame = document.createElement('div');
    frame.className = 'slider-frame';

    var track = document.createElement('div');
    track.className = 'slider-track';

    slides.forEach(function (slide, index) {
      var slideDiv = document.createElement('div');
      slideDiv.className = 'slider-slide' + (index === 0 ? ' is-active' : '');

      var imgAttrs = index === 0
        ? 'loading="eager" fetchpriority="high" decoding="sync"'
        : 'loading="eager" decoding="async"';

      var imageContainer = '<div class="slider-image-container">' +
        '<img src="' + slide.src + '" alt="' + (slide.alt || '') + '" ' + imgAttrs + '>' +
        '</div>';

      // AKILLI KONTROL: Sadece başlık verisi (title) dolu olan slaytlara metin kutusu ekler
      var titleHtml = (slide.title && slide.title.trim().length > 0)
        ? '<div class="slider-title"><p>' + slide.title + '</p></div>'
        : '';

      var innerContent = imageContainer + titleHtml;

      if (slide.link) {
        slideDiv.innerHTML = '<a href="' + slide.link + '">' + innerContent + '</a>';
      } else {
        slideDiv.innerHTML = innerContent;
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
      dockContainer.className = 'slider-dock-container d-flex justify-content-center mt-3';

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
    preloadImages(); // Slayt başlatılınca diğer resimleri arka planda indirir
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
      var img = new Image();
      img.src = nextSlide.src;
      if (img.decode) {
        img.decode().catch(function () {});
      }
    }
  }

  function updateDOM() {
    slideElements.forEach(function (slide, idx) {
      if (idx === activeIndex) {
        slide.classList.add('is-active');
      } else {
        slide.classList.remove('is-active');
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
      progressBar.classList.remove('is-animating');
      void progressBar.offsetWidth; // Reflow
      
      if (!isPaused) {
        progressBar.classList.add('is-animating');
        progressBar.style.animationPlayState = 'running';
      } else {
        progressBar.style.animationPlayState = 'paused';
      }
    }

    preloadNextSlide(activeIndex);
  }

  function togglePause() {
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
    activeIndex = idx;
    clearTimeout(timer);
    timer = null;
    updateDOM();
    if (!isPaused) {
      scheduleNext();
    }
  }

  function scheduleNext() {
    if (slides.length <= 1) return;
    if (isPaused) return;
    
    timer = setTimeout(function () {
      activeIndex = (activeIndex + 1) % slides.length;
      updateDOM();
      scheduleNext();
    }, durationMs);
  }

  init();
  if (!isPaused) scheduleNext();

  return {
    destroy: function () {
      clearTimeout(timer);
    },
  };
}