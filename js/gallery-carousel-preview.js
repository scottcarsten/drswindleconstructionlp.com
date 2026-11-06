/* DR Swindle Construction LP - menu, carousels, lightbox. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ARROW = { l: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8"/></svg>', r: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg>', x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>' };

  /* ---- lightbox ---- */
  var lb, lbImg, lbCap, items = [], idx = 0, opener = null, sx = null;
  function buildLb() {
    lb = document.createElement('dialog');
    lb.className = 'gcp-lb';
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = '<div class="gcp-lb-stage"><img alt=""></div>' +
      '<button class="gcp-lb-close" type="button" aria-label="Close">' + ARROW.x + '</button>' +
      '<button class="gcp-lb-prev" type="button" aria-label="Previous photo">' + ARROW.l + '</button>' +
      '<button class="gcp-lb-next" type="button" aria-label="Next photo">' + ARROW.r + '</button>' +
      '<div class="gcp-lb-cap" aria-live="polite"></div>';
    document.body.appendChild(lb);
    lbImg = $('img', lb); lbCap = $('.gcp-lb-cap', lb);
    $('.gcp-lb-close', lb).onclick = function () { lb.close(); };
    $('.gcp-lb-prev', lb).onclick = function () { show(idx - 1); };
    $('.gcp-lb-next', lb).onclick = function () { show(idx + 1); };
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'Home') show(0);
      else if (e.key === 'End') show(items.length - 1);
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('gcp-lb-stage')) lb.close(); });
    lb.addEventListener('close', function () { document.documentElement.style.overflow = ''; if (opener) opener.focus(); });
    var st = $('.gcp-lb-stage', lb);
    st.addEventListener('touchstart', function (e) { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
    st.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var d = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1));
    }, { passive: true });
  }
  function show(i) {
    idx = (i + items.length) % items.length;
    var it = items[idx];
    lbImg.style.opacity = .4;
    lbImg.onload = function () { lbImg.style.opacity = 1; };
    lbImg.src = it.full; lbImg.alt = it.alt;
    lbCap.textContent = it.alt + ' (' + (idx + 1) + ' of ' + items.length + ')';
    [idx + 1, idx - 1].forEach(function (n) { var p = items[(n + items.length) % items.length]; if (p) new Image().src = p.full; });
  }
  function openLb(list, i, from) {
    if (!lb) buildLb();
    items = list; opener = from;
    document.documentElement.style.overflow = 'hidden';
    lb.showModal(); show(i);
  }

  /* ---- carousels ---- */
  $$('.gcp-carousel').forEach(function (c) {
    var track = $('.gcp-track', c), slides = $$('.gcp-slide', c), hero = c.classList.contains('hero-car');
    var prev = $('.gcp-prev', c), next = $('.gcp-next', c), count = $('.gcp-count', c.parentNode), dots = $('.gcp-dots', c), cur = 0;
    var list = slides.map(function (s) { var im = $('img', s); return { full: s.getAttribute('data-full'), alt: im.alt }; });
    slides.forEach(function (s, i) { s.tabIndex = i === 0 ? 0 : -1; });
    function per() { return Math.round(track.clientWidth / (slides[0].offsetWidth + 10)) || 1; }
    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[i].offsetLeft - track.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    }
    function update() {
      var w = slides[0].offsetWidth + 10;
      cur = Math.min(slides.length - 1, Math.round(track.scrollLeft / w));
      var p = per(), end = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = end;
      if (count) count.textContent = hero ? '' : 'Photos ' + (cur + 1) + '–' + Math.min(slides.length, cur + p) + ' of ' + slides.length;
      if (dots) $$('button', dots).forEach(function (d, i) { d.setAttribute('aria-current', i === cur); });
    }
    if (prev) prev.onclick = function () { go(cur - per()); };
    if (next) next.onclick = function () { go(cur + per()); };
    if (dots) slides.forEach(function (s, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.onclick = function () { go(i); }; dots.appendChild(b);
    });
    var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(update, 60); }, { passive: true });
    window.addEventListener('resize', update);
    // keyboard: roving focus across slides
    track.addEventListener('keydown', function (e) {
      var i = slides.indexOf(document.activeElement); if (i < 0) return;
      var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: slides.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault(); n = Math.max(0, Math.min(slides.length - 1, n));
      slides[i].tabIndex = -1; slides[n].tabIndex = 0; slides[n].focus({ preventScroll: true }); go(n);
    });
    slides.forEach(function (s, i) {
      if (!hero) s.addEventListener('click', function () { openLb(list, i, s); });
    });
    // hero: gentle autoplay, paused on hover/focus/reduced-motion
    if (hero && !reduce && slides.length > 1) {
      var timer, paused = false;
      var tick = function () { if (paused || document.hidden) return; go(cur + 1 >= slides.length ? 0 : cur + 1); };
      c.addEventListener('mouseenter', function () { paused = true; });
      c.addEventListener('mouseleave', function () { paused = false; });
      c.addEventListener('focusin', function () { paused = true; });
      c.addEventListener('focusout', function () { paused = false; });
      timer = setInterval(tick, 6000);
    }
    update();
  });

})();
