/* ===================================================================
   Navbar – responsive navigation with desktop dropdown, floating capsule,
   Contact Pop-Up Modal, Dynamic Rotating Mobile FAB & SPA Fixes
   =================================================================== */

function Navbar(container) {
  var isOpen = false;
  var modalOpener = null;
  var previousBodyOverflow = '';

  // DÜZELTİLDİ: Eksik olan routeHref yardımcı fonksiyonu eklendi
  function routeHref(route) {
    if (window.Router && typeof window.Router.getRouteHref === 'function') {
      return window.Router.getRouteHref(route);
    }
    var normalized = (route || 'home').replace(/^\/+/, '').replace(/\/?$/, '');
    return normalized === 'home' ? '/' : '/' + normalized;
  }

  var groupItems = Object.keys(GroupSlugToEnum).map(function (slug) {
    return {
      href: routeHref('products/' + slug),
      label: ProductGroupLabels[GroupSlugToEnum[slug]],
    };
  });

  function buildDesktopGroupLinks() {
    return groupItems.map(function (g) {
      return '<li><a href="' + g.href + '" class="text-decoration-none d-block px-3 py-2 fw-semibold">' + g.label + '</a></li>';
    }).join('');
  }

  function buildMobileLinks() {
    var navItems = [
      { label: 'Ana Sayfa', href: routeHref('home') },
      { label: 'Hakkımızda', href: routeHref('about') },
      { label: 'Ürünlerimiz', href: routeHref('products') },
      { label: 'Blog', href: routeHref('blog') },
      { label: 'SSS', href: routeHref('faq') },
      { label: 'İletişim', href: routeHref('contact') },
    ];

    return navItems.map(function (item) {
      var subLinks = '';
      if (item.href === routeHref('products')) {
        subLinks = '<ul class="sub-links list-unstyled m-0 ps-3">' +
          groupItems.map(function (g) {
            return '<li><a href="' + g.href + '" class="text-decoration-none d-block px-3 py-2 fw-semibold text-secondary">' + g.label + '</a></li>';
          }).join('') +
          '</ul>';
      }
      return '<li>' +
        '<a href="' + item.href + '" class="text-decoration-none d-block px-3 py-2 fw-semibold">' + item.label + '</a>' +
        subLinks +
        '</li>';
    }).join('');
  }

  function render() {
    container.innerHTML =
      '<nav class="navbar position-relative py-2" aria-label="Main navigation">' +
        '<div class="container d-flex align-items-center justify-content-between">' +
          
          /* Logo */
          '<a href="' + routeHref('home') + '" class="navbar-brand d-flex align-items-center gap-2 text-decoration-none" aria-label="Probiyom ana sayfa">' +
            '<img src="images/logo.svg" alt="Probiyom logo" style="height: 50px; width: auto;">' +
            '<span class="fs-6 fw-bold tracking-tight text-white">Probiyom</span>' +
          '</a>' +

          /* Masaüstü Linkler */
          '<ul class="navbar-links list-unstyled m-0 align-items-center gap-4">' +
            '<li><a href="' + routeHref('home') + '" class="text-decoration-none fw-semibold">Ana Sayfa</a></li>' +
            '<li><a href="' + routeHref('about') + '" class="text-decoration-none fw-semibold">Hakkımızda</a></li>' +
            '<li class="nav-dropdown position-relative">' +
              '<a href="' + routeHref('products') + '" class="nav-dropdown-trigger text-decoration-none fw-semibold d-flex align-items-center gap-1">' +
                '<span>Ürünlerimiz</span>' +
                '<span class="nav-dropdown-arrow" aria-hidden="true">▾</span>' +
              '</a>' +
              '<div class="nav-dropdown-menu position-absolute end-0 top-100 pt-2">' +
                '<div class="nav-dropdown-panel rounded-3 border border-light-subtle shadow">' +
                  '<ul class="list-unstyled m-0 py-2">' + buildDesktopGroupLinks() + '</ul>' +
                '</div>' +
              '</div>' +
            '</li>' +
            '<li><a href="' + routeHref('blog') + '" class="text-decoration-none fw-semibold">Blog</a></li>' +
            '<li><a href="' + routeHref('faq') + '" class="text-decoration-none fw-semibold">SSS</a></li>' +
            '<li><a href="' + routeHref('contact') + '" class="text-decoration-none fw-semibold">İletişim</a></li>' +
            '<li>' +
              '<a href="' + routeHref('contact') + '" data-router-ignore="true" class="nav-contact-btn text-decoration-none fw-bold small px-3 py-2 rounded-pill" id="nav-contact-trigger">' +
                'Bize Ulaşın' +
              '</a>' +
            '</li>' +
          '</ul>' +

          /* Mobil Menü Butonu */
          '<button type="button" class="navbar-mobile-btn d-inline-flex d-md-none align-items-center justify-content-center border border-white-50 rounded-3 px-3 py-2 text-white" aria-label="Menüyü aç/kapat">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" class="me-2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>' +
            '<span class="small fw-semibold">Menü</span>' +
          '</button>' +

        '</div>' +

        /* Mobil Açılır Menü Panel */
        '<div class="mobile-menu position-absolute top-100 end-0 w-100 mt-2 d-none">' +
          '<div class="mobile-menu-panel rounded-3 border border-light-subtle shadow max-h-70 overflow-y-auto" style="overscroll-behavior: contain;">' +
            '<ul class="list-unstyled m-0 py-2">' + buildMobileLinks() + '</ul>' +
          '</div>' +
        '</div>' +

      '</nav>';

    // Sol Alt Yüzen Buton (FAB) Başlatıcı
    initMobileFab();

    /* Events */
    var btn = container.querySelector('.navbar-mobile-btn');
    var mobileMenu = container.querySelector('.mobile-menu');
    if (btn && mobileMenu) {
      mobileMenu.id = 'mobile-navigation-menu';
      btn.setAttribute('aria-controls', mobileMenu.id);
      btn.setAttribute('aria-expanded', 'false');
    }
    if (btn) {
      btn.addEventListener('click', function () {
        isOpen = !isOpen;
        btn.setAttribute('aria-expanded', String(isOpen));
        var menu = container.querySelector('.mobile-menu');
        if (menu) {
          menu.classList.toggle('is-open', isOpen);
        }
      });
    }

    /* Close mobile menu when a link is clicked */
    var mobileLinks = container.querySelectorAll('.mobile-menu a');
    for (var i = 0; i < mobileLinks.length; i++) {
      mobileLinks[i].addEventListener('click', function () {
        isOpen = false;
        btn.setAttribute('aria-expanded', 'false');
        var menu = container.querySelector('.mobile-menu');
        if (menu) menu.classList.remove('is-open');
      });
    }

    function closeMobileMenu(restoreFocus) {
      if (!isOpen) return;
      isOpen = false;
      var menu = container.querySelector('.mobile-menu');
      if (menu) menu.classList.remove('is-open');
      if (btn) {
        btn.setAttribute('aria-expanded', 'false');
        if (restoreFocus) btn.focus();
      }
    }
    document.addEventListener('click', function (event) {
      if (isOpen && !container.contains(event.target)) closeMobileMenu(false);
    });
    container.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMobileMenu(true);
    });

    /* Masaüstü açılır menüdeki linklere tıklandığında menüyü anında kapatır */
    var dropdownLinks = container.querySelectorAll('.nav-dropdown-menu a');
    for (var d = 0; d < dropdownLinks.length; d++) {
      dropdownLinks[d].addEventListener('click', function () {
        var dropdownMenu = container.querySelector('.nav-dropdown-menu');
        if (dropdownMenu) {
          dropdownMenu.classList.add('force-hide');
          setTimeout(function () {
            dropdownMenu.classList.remove('force-hide');
          }, 300);
        }
      });
    }

    // Mobil ve Masaüstü 'Bize Ulaşın' Butonları Pop-Up Tetikleyici
    bindContactModalTriggers();

    // Scroll takip fonksiyonu
    function handleScroll() {
      var scrolled = window.scrollY > 40;
      var navbarEl = container.querySelector('.navbar');
      if (navbarEl) {
        if (scrolled) {
          navbarEl.classList.add('is-scrolled');
        } else {
          navbarEl.classList.remove('is-scrolled');
        }
      }
    }

    window.addEventListener('scroll', handleScroll);
    setTimeout(handleScroll, 50);

    function syncActiveNav() {
      if (isOpen) {
        isOpen = false;
        var mobileNav = container.querySelector('.mobile-menu');
        if (mobileNav) mobileNav.classList.remove('is-open');
        var mobileToggle = container.querySelector('.navbar-mobile-btn');
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
      }
      var currentPath = window.location.pathname.replace(/\/$/, '') || '/';
      var links = container.querySelectorAll('.navbar-links a, .mobile-menu a');
      for (var n = 0; n < links.length; n++) {
        var linkPath = new URL(links[n].href, window.location.href).pathname.replace(/\/$/, '') || '/';
        var active = linkPath === currentPath || (linkPath !== '/' && currentPath.indexOf(linkPath + '/') === 0);
        if (active) links[n].setAttribute('aria-current', 'page');
        else links[n].removeAttribute('aria-current');
        links[n].classList.toggle('is-active', active);
      }
    }
    syncActiveNav();
    document.addEventListener('routechange', syncActiveNav);
  }

  /* Mobile social and contact dock */
  function initMobileFab() {
    var existingFab = document.getElementById('mobile-fab-container');
    if (existingFab) existingFab.remove();

    var fabWrapper = document.createElement('div');
    fabWrapper.id = 'mobile-fab-container';
    fabWrapper.className = 'mobile-fab-container';
    fabWrapper.innerHTML = 
      '<div class="mobile-fab-menu" id="mobile-fab-menu" inert>' +
        '<div class="social-dock-heading"><span class="social-dock-mark" aria-hidden="true"></span><span>Sosyalde buluşalım</span></div>' +
        '<button type="button" class="mobile-fab-cta-btn" id="nav-contact-trigger-mobile">' +
          '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
          '<span>Bize Ulaşın</span>' +
        '</button>' +
        '<div class="mobile-fab-divider"></div>' +
        '<div class="mobile-fab-socials">' +
          '<a href="https://x.com/probiyom" target="_blank" rel="noopener" aria-label="X"><svg viewBox="0 0 512 512" width="14" height="14" fill="#ffffff"><path d="M403.2 48h78.643l-171.52 196.544L512 488h-158.016l-123.744-161.248L99.136 488H10.112l183.456-210.24L0 48h161.024l111.84 148.288L403.2 48zm-27.52 417.792h43.52L138.368 68.672H91.776z"/></svg></a>' +
          '<a href="https://instagram.com/probiyom" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 512 512" width="14" height="14" fill="#ffffff"><path d="M256 109.3c47.8 0 53.4 0.2 72.3 1 17.4 0.8 26.9 3.7 33.2 6.2 8.4 3.2 14.3 7.1 20.6 13.4 6.3 6.3 10.1 12.2 13.4 20.6 2.5 6.3 5.4 15.8 6.2 33.2 0.9 18.9 1 24.5 1 72.3s-0.2 53.4-1 72.3c-0.8 17.4-3.7 26.9-6.2 33.2 -3.2 8.4-7.1 14.3-13.4 20.6 -6.3 6.3-12.2 10.1-20.6 13.4 -6.3 2.5-15.8 5.4-33.2 6.2 -18.9 0.9-24.5 1-72.3 1s-53.4-0.2-72.3-1c-17.4-0.8-26.9-3.7-33.2-6.2 -8.4-3.2-14.3-7.1-20.6-13.4 -6.3-6.3-10.1-12.2-13.4-20.6 -2.5-6.3-5.4-15.8-6.2-33.2 -0.9-18.9-1-24.5-1-72.3s0.2-53.4 1-72.3c0.8-17.4 3.7-26.9 6.2-33.2 3.2-8.4 7.1-14.3 13.4-20.6 6.3-6.3 12.2-10.1 20.6-13.4 6.3-2.5 15.8-5.4 33.2-6.2C202.6 109.5 208.2 109.3 256 109.3M256 77.1c-48.6 0-54.7 0.2-73.8 1.1 -19 0.9-32.1 3.9-43.4 8.3 -11.8 4.6-21.7 10.7-31.7 20.6 -9.9 9.9-16.1 19.9-20.6 31.7 -4.4 11.4-7.4 24.4-8.3 43.4 -0.9 19.1-1.1 25.2-1.1 73.8 0 48.6 0.2 54.7 1.1 73.8 0.9 19 3.9 32.1 8.3 43.4 4.6 11.8 10.7 21.7 20.6 31.7 9.9 9.9 19.9 16.1 31.7 20.6 11.4 4.4 24.4 7.4 43.4 8.3 19.1 0.9 25.2 1.1 73.8 1.1s54.7-0.2 73.8-1.1c19-0.9 32.1-3.9 43.4-8.3 11.8-4.6 21.7-10.7 31.7-20.6 9.9-9.9 19.9-16.1 31.7-20.6 -11.4-4.4-24.4-7.4-43.4-8.3C310.7 77.3 304.6 77.1 256 77.1L256 77.1z"/><path d="M256 164.1c-50.7 0-91.9 41.1-91.9 91.9s41.1 91.9 91.9 91.9 91.9-41.1 91.9-91.9S306.7 164.1 256 164.1zM256 315.6c-32.9 0-59.6-26.7-59.6-59.6s26.7-59.6 59.6-59.6 59.6 26.7 59.6 59.6S288.9 315.6 256 315.6z"/><circle cx="351.5" cy="160.5" r="21.5"/></svg></a>' +
          '<a href="https://linkedin.com/company/probiyom" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 512 512" width="14" height="14" fill="#ffffff"><path d="M186.4 142.4c0 19-15.3 34.5-34.2 34.5 -18.9 0-34.2-15.4-34.2-34.5 0-19 15.3-34.5 34.2-34.5C171.1 107.9 186.4 123.4 186.4 142.4zM181.4 201.3h-57.8V388.1h57.8V201.3zM273.8 201.3h-55.4V388.1h55.4c0 0 0-69.3 0-98 0-26.3 12.1-41.9 35.2-41.9 21.3 0 31.5 15 31.5 41.9 0 26.9 0 98 0 98h57.5c0 0 0-68.2 0-118.3 0-50-28.3-74.2-68-74.2 -39.6 0-56.3 30.9-56.3 30.9v-25.2H273.8z"/></svg></a>' +
          '<a href="https://youtube.com/@probiyom" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 512 512" width="14" height="14" fill="#ffffff"><path d="M424.4 113c-15.6-10-53.4-14-168.4-14s-152.8 4-168.4 14C56 133.5 48 190.5 48 256s8 122.5 39.6 143c15.6 10 53.4 14 168.4 14s152.8-4 168.4-14c31.6-20.5 39.6-77.5 39.6-143s-8-122.5-39.6-143zM212 334V178l128 78z"/></svg></a>' +
        '</div>' +
      '</div>' +

      '<button type="button" class="mobile-fab-trigger position-relative overflow-hidden" id="mobile-fab-trigger" aria-label="Sosyal medya ve iletişim menüsü" aria-expanded="false" aria-controls="mobile-fab-menu">' +
        '<span class="fab-icon-switcher">' +
          '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="5" r="2.5"/><circle cx="17" cy="19" r="2.5"/><path d="m8.2 10.6 6.6-4.2m-6.6 7 6.6 4.2"/></svg>' +
        '</span>' +
        '<span class="fab-trigger-label">Bağlan</span>' +
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="fab-icon-close d-none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
      '</button>';

    document.body.appendChild(fabWrapper);

    /* Sol Alt Yüzen Buton (FAB) Tıklama ve Dışarı Tıklayınca Kapanma Mantığı */
    var fabTrigger = document.querySelector('#mobile-fab-trigger');
    if (fabTrigger) {
      fabTrigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var fabMenu = document.querySelector('#mobile-fab-menu');
        var switcher = fabTrigger.querySelector('.fab-icon-switcher');
        var closeIcon = fabTrigger.querySelector('.fab-icon-close');
        
        if (fabMenu) setFabMenuOpen(fabMenu, fabTrigger, switcher, closeIcon, !fabMenu.classList.contains('is-open'));
      });

      // Ekranda başka yere tıklandığında paneli kapatır
      document.addEventListener('click', function (e) {
        var fabContainer = document.querySelector('#mobile-fab-container');
        var fabMenu = document.querySelector('#mobile-fab-menu');
        if (fabContainer && fabMenu && !fabContainer.contains(e.target)) {
          var switcher = fabTrigger.querySelector('.fab-icon-switcher');
          var closeIcon = fabTrigger.querySelector('.fab-icon-close');
          setFabMenuOpen(fabMenu, fabTrigger, switcher, closeIcon, false);
        }
      });
      document.addEventListener('keydown', function (e) {
        var menu = document.querySelector('#mobile-fab-menu');
        if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) {
          var switcher = fabTrigger.querySelector('.fab-icon-switcher');
          var closeIcon = fabTrigger.querySelector('.fab-icon-close');
          setFabMenuOpen(menu, fabTrigger, switcher, closeIcon, false);
          fabTrigger.focus();
        }
      });
    }
  }

  function setFabMenuOpen(menu, trigger, switcher, closeIcon, open) {
    menu.classList.toggle('is-open', open);
    if (open) menu.removeAttribute('inert');
    else menu.setAttribute('inert', '');
    trigger.setAttribute('aria-expanded', String(open));
    if (switcher && closeIcon) {
      switcher.classList.toggle('d-none', open);
      closeIcon.classList.toggle('d-none', !open);
    }
  }

  function bindContactModalTriggers() {
    var contactBtns = document.querySelectorAll('#nav-contact-trigger, #nav-contact-trigger-mobile');
    contactBtns.forEach(function(contactBtn) {
      contactBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (contactBtn.tagName === 'A') e.stopPropagation();
        try {
          if (typeof ContactForm === 'function') {
            openContactModal();
          } else {
            if (window.Router && typeof window.Router.navigate === 'function') {
              window.Router.navigate('contact');
            } else {
              window.location.href = '/contact';
            }
          }
        } catch (err) {
          if (window.Router && typeof window.Router.navigate === 'function') {
            window.Router.navigate('contact');
          } else {
            window.location.href = '/contact';
          }
        }
      });
    });
  }

  /* Sayfa İçi Pop-Up Modal Oluşturucu ve Yöneticisi */
  function openContactModal() {
    modalOpener = document.activeElement;
    var modal = document.getElementById('contact-modal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'contact-modal';
      modal.className = 'contact-modal-overlay';
      modal.setAttribute('inert', '');
      modal.innerHTML = 
        '<div class="contact-modal-dialog position-relative" role="dialog" tabindex="-1" aria-modal="true" aria-labelledby="contact-modal-title">' +
          '<h2 id="contact-modal-title" class="visually-hidden">İletişim formu</h2>' +
          '<button type="button" class="contact-modal-close" aria-label="Kapat">&times;</button>' +
          '<div id="modal-form-container"></div>' +
        '</div>';
      
      document.body.appendChild(modal);

      var closeBtn = modal.querySelector('.contact-modal-close');
      closeBtn.addEventListener('click', closeContactModal);

      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          closeContactModal();
        }
      });

      modal.addEventListener('transitionend', function (e) {
        if (e.target === modal && modal.classList.contains('is-visible') &&
            !modal.contains(document.activeElement)) {
          modal.querySelector('[role="dialog"]').focus({ preventScroll: true });
        }
      });

      modal.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeContactModal();
          return;
        }
        if (e.key !== 'Tab') return;
        var focusable = modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) { e.preventDefault(); modal.querySelector('.contact-modal-close').focus(); return; }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (document.activeElement === modal.querySelector('[role="dialog"]')) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }

    var formContainer = modal.querySelector('#modal-form-container');
    if (formContainer && typeof ContactForm === 'function') {
      ContactForm(formContainer);
    } else {
      if (window.Router && typeof window.Router.navigate === 'function') {
        window.Router.navigate('contact');
      } else {
        window.location.href = '/contact';
      }
      return;
    }

    requestAnimationFrame(function () {
      previousBodyOverflow = document.body.style.overflow;
      modal.removeAttribute('inert');
      modal.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      var dialog = modal.querySelector('[role="dialog"]');
      requestAnimationFrame(function () {
        if (dialog && modal.classList.contains('is-visible') && !modal.hasAttribute('inert')) {
          dialog.focus({ preventScroll: true });
        }
      });
    });
  }

  function closeContactModal() {
    var modal = document.getElementById('contact-modal');
    if (modal) {
      modal.classList.remove('is-visible');
      modal.setAttribute('inert', '');
      document.body.style.overflow = previousBodyOverflow;
      if (modalOpener && typeof modalOpener.focus === 'function') modalOpener.focus();
    }
  }

  render();

  /* Close mobile menu on desktop resize */
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 850) {
      var fabMenu = document.querySelector('#mobile-fab-menu');
      var fabButton = document.querySelector('#mobile-fab-trigger');
      if (fabMenu && fabButton && fabMenu.classList.contains('is-open')) {
        setFabMenuOpen(fabMenu, fabButton, fabButton.querySelector('.fab-icon-switcher'), fabButton.querySelector('.fab-icon-close'), false);
      }
    }
    if (window.innerWidth >= 850 && isOpen) {
      isOpen = false;
      var mobileBtn = container.querySelector('.navbar-mobile-btn');
      if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'false');
      var menu = container.querySelector('.mobile-menu');
      if (menu) menu.classList.remove('is-open');
    }
  });
}
