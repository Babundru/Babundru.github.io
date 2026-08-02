/* ============================================================
   Shared behaviour: reveal, nav, scroll progress, image
   fallbacks, lightbox. Loaded by every page.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- staggered reveal delays for grouped elements ---- */
  document.querySelectorAll('.proj-grid, .stats, .skill-groups, .big-stats').forEach(function (group) {
    group.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.setProperty('--d', (i * 0.08) + 's');
    });
  });

  /* ---- intersection-based reveal ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---- scroll progress + nav shrink + hero parallax, one rAF loop ---- */
  var navEl = document.getElementById('nav');
  var progressEl = document.getElementById('scrollProgress');
  var heroGrid = document.querySelector('.hero-grid');
  var ticking = false;

  function onScroll() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressEl) progressEl.style.width = pct + '%';
    if (navEl) navEl.classList.toggle('scrolled', scrollTop > 40);
    if (heroGrid && !reduceMotion) {
      heroGrid.style.transform = 'translateY(' + (scrollTop * 0.15) + 'px)';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---- active nav link tracking (landing page only) ---- */
  var sections = ['about', 'projects', 'creator', 'skills', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  if (sections.length) {
    var navLinks = document.querySelectorAll('.nav-links a');
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(function (sec) { navObserver.observe(sec); });
  }

  /* ------------------------------------------------------------
     Missing-screenshot fallback.
     Every .shot img that fails to load is swapped for a styled
     placeholder naming the file that belongs there. Keeps the
     site presentable before the images exist, and upgrades
     itself the moment a correctly-named file is dropped in.
     ------------------------------------------------------------ */
  var PH_ICON = '<svg class="ph-icon" width="34" height="34" viewBox="0 0 24 24" fill="none" ' +
    'xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="18" height="14" rx="2" ' +
    'stroke="#9AA3BF" stroke-width="1.4"/><circle cx="8.5" cy="10" r="1.6" stroke="#9AA3BF" ' +
    'stroke-width="1.4"/><path d="M4 17l4.5-4.5 3 3L15 12l5 5" stroke="#9AA3BF" ' +
    'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function placehold(img) {
    if (!img || img.dataset.phDone) return;
    img.dataset.phDone = '1';
    var src = img.getAttribute('src') || '';
    var file = src.replace(/^\.\.\//, '');
    var div = document.createElement('div');
    div.className = 'shot-ph';
    div.innerHTML = PH_ICON +
      '<div class="ph-title">Screenshot pending</div>' +
      '<div class="ph-file">' + file + '</div>';
    img.replaceWith(div);
  }

  document.querySelectorAll('.shot img, .card-thumb img').forEach(function (img) {
    if (img.closest('.card-thumb')) {
      img.addEventListener('error', function () {
        var wrap = img.closest('.card-thumb');
        if (!wrap || wrap.dataset.phDone) return;
        wrap.dataset.phDone = '1';
        wrap.innerHTML = '<div class="ph-mini">' + (img.dataset.ph || 'screenshot pending') + '</div>';
      });
    } else {
      img.addEventListener('error', function () { placehold(img); });
    }
    /* images that already failed before this script ran */
    if (img.complete && img.naturalWidth === 0) {
      img.dispatchEvent(new Event('error'));
    }
  });

  /* ---- lightbox: click a screenshot to view it full size ---- */
  var shots = document.querySelectorAll('.shot img');
  if (shots.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button><img alt="">';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');

    shots.forEach(function (img) {
      img.addEventListener('click', function () {
        if (!img.naturalWidth) return;
        lbImg.src = img.src;
        lbImg.alt = img.alt || '';
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    function closeLb() {
      lb.classList.remove('open');
      document.body.style.overflow = '';
      lbImg.src = '';
    }
    lb.addEventListener('click', closeLb);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('open')) closeLb();
    });
  }
})();
