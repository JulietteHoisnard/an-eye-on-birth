// Mobile nav toggle
(function () {
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const isOpen = navLinks.classList.contains('open');
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
})();

// Photography dropdown — trigger toggles the submenu
(function () {
  const dropdown = document.querySelector('.nav-dropdown');
  if (!dropdown) return;

  const trigger = dropdown.querySelector('.nav-dropdown-trigger');
  if (!trigger) return;

  function toggleDropdown(force) {
    const isOpen = force !== undefined ? force : !dropdown.classList.contains('open');
    dropdown.classList.toggle('open', isOpen);
    trigger.setAttribute('aria-expanded', isOpen);
  }

  // Clicking the trigger (Photography + arrow) toggles the menu
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleDropdown();
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      toggleDropdown(false);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggleDropdown(false);
  });
})();

// Lightbox
(function () {
  const overlay = document.getElementById('lightbox-overlay');
  if (!overlay) return;

  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  const galleryItems = Array.from(document.querySelectorAll('.gallery-item img'));
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    lightboxImg.src = galleryItems[index].src;
    lightboxImg.alt = galleryItems[index].alt;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    lightboxImg.src = galleryItems[currentIndex].src;
    lightboxImg.alt = galleryItems[currentIndex].alt;
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    lightboxImg.src = galleryItems[currentIndex].src;
    lightboxImg.alt = galleryItems[currentIndex].alt;
  }

  galleryItems.forEach((img, i) => {
    img.parentElement.addEventListener('click', () => openLightbox(i));
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
})();

// Stats carousel — multi-card sliding carousel
(function () {
  var section = document.querySelector('.stats-carousel-section');
  if (!section) return;

  var track    = document.getElementById('stats-track');
  var prevBtn  = document.getElementById('stats-prev');
  var nextBtn  = document.getElementById('stats-next');
  var dotsWrap = document.getElementById('stats-dots');
  if (!track) return;

  var cards = Array.from(track.querySelectorAll('.stat-card'));
  var total = cards.length;
  var current = 0;

  function visibleCount() {
    var w = section.offsetWidth;
    if (w <= 700) return 1;
    if (w <= 950) return 2;
    return 3;
  }

  function maxIndex() {
    return Math.max(0, total - visibleCount());
  }

  function buildDots() {
    dotsWrap.innerHTML = '';
    var count = maxIndex() + 1;
    for (var i = 0; i < count; i++) {
      var dot = document.createElement('span');
      dot.className = 'stats-dot' + (i === current ? ' active' : '');
      (function (idx) {
        dot.addEventListener('click', function () { goTo(idx); });
      })(i);
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    var dots = Array.from(dotsWrap.querySelectorAll('.stats-dot'));
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === current);
    });
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, maxIndex()));
    var cardWidth = cards[0].offsetWidth;
    var gap = parseFloat(getComputedStyle(track).gap) || 20;
    track.style.transform = 'translateX(-' + (current * (cardWidth + gap)) + 'px)';
    updateDots();
    prevBtn && (prevBtn.disabled = current === 0);
    nextBtn && (nextBtn.disabled = current >= maxIndex());
  }

  buildDots();
  goTo(0);

  prevBtn && prevBtn.addEventListener('click', function () { goTo(current - 1); });
  nextBtn && nextBtn.addEventListener('click', function () { goTo(current + 1); });

  // Touch/swipe support
  var startX = null;
  track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? goTo(current + 1) : goTo(current - 1); }
    startX = null;
  });

  // Rebuild on resize
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      buildDots();
      goTo(Math.min(current, maxIndex()));
    }, 150);
  });
})();

// Testimonial carousel — manual prev/next + auto-advance every 6 s
(function () {
  // Support multiple carousels on the page (there is only one per page, but this is future-proof)
  document.querySelectorAll('.testimonial-carousel').forEach(function (carousel) {
    const slides = Array.from(carousel.querySelectorAll('.testimonial-slide'));
    const dots   = Array.from(carousel.querySelectorAll('.testimonial-dot'));
    const prevBtn = carousel.querySelector('.testimonial-prev');
    const nextBtn = carousel.querySelector('.testimonial-next');
    if (!slides.length) return;

    let current = 0;
    let timer   = null;
    const INTERVAL = 6000; // ms between auto-advances

    function goTo(index) {
      slides[current].classList.remove('active');
      dots[current] && dots[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current] && dots[current].classList.add('active');
    }

    function startAuto() {
      timer = setInterval(function () { goTo(current + 1); }, INTERVAL);
    }

    function stopAuto() {
      clearInterval(timer);
    }

    // Arrow buttons
    prevBtn && prevBtn.addEventListener('click', function () {
      stopAuto();
      goTo(current - 1);
      startAuto();
    });

    nextBtn && nextBtn.addEventListener('click', function () {
      stopAuto();
      goTo(current + 1);
      startAuto();
    });

    // Dot clicks
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        stopAuto();
        goTo(i);
        startAuto();
      });
    });

    // Pause on hover / focus inside the carousel
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('focusin',    stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('focusout',   function (e) {
      // Only restart if focus has left the carousel entirely
      if (!carousel.contains(e.relatedTarget)) startAuto();
    });

    // Kick off
    startAuto();
  });
})();
