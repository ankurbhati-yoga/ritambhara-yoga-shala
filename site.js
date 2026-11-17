(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function closeMenu() {
    if (!toggle || !nav) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menu';
    document.body.classList.remove('nav-open');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var willOpen = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', willOpen);
      toggle.setAttribute('aria-expanded', String(willOpen));
      toggle.textContent = willOpen ? 'Close' : 'Menu';
      document.body.classList.toggle('nav-open', willOpen);
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 820) closeMenu();
    });
  }

  var select = document.getElementById('class-interest');
  if (select) {
    var requestedClass = new URLSearchParams(window.location.search).get('class');
    var optionExists = Array.from(select.options).some(function (option) {
      return option.value === requestedClass;
    });
    if (requestedClass && optionExists) select.value = requestedClass;
  }
}());

(function () {
  var carousel = document.querySelector('.class-carousel');
  if (!carousel) return;
  var viewport = carousel.querySelector('.class-slider-viewport');
  var slides = Array.from(viewport.querySelectorAll('.offering'));
  var choices = Array.from(carousel.querySelectorAll('[data-class-slide]'));
  var prev = carousel.querySelector('.class-slide-prev');
  var next = carousel.querySelector('.class-slide-next');
  var count = carousel.querySelector('.class-slide-count');
  var toggle = carousel.querySelector('.class-auto-toggle');
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = 0, frame = 0, autoTimer = 0, scrollTimer = 0;
  var paused = false, hovering = false, focused = false, dragging = false;
  var visible = false, gliding = false;
  var clone = slides[0].cloneNode(true);
  clone.classList.add('carousel-clone');
  clone.setAttribute('aria-hidden', 'true');
  clone.removeAttribute('aria-roledescription');
  clone.removeAttribute('aria-label');
  clone.inert = true;
  clone.querySelectorAll('a, button, input').forEach(function (el) { el.setAttribute('tabindex', '-1'); });
  viewport.appendChild(clone);

  function update(index, automatic) {
    current = ((index % slides.length) + slides.length) % slides.length;
    choices.forEach(function (button, i) { button.setAttribute('aria-pressed', String(i === current)); });
    prev.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    count.setAttribute('aria-live', automatic ? 'off' : 'polite');
    count.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
  }
  function stopTimer() { clearTimeout(autoTimer); }
  function schedule() {
    stopTimer();
    if (paused || hovering || focused || dragging || !visible || document.hidden || motion.matches || gliding) return;
    autoTimer = setTimeout(function () { go(current + 1, true); }, 7000);
  }
  function stopGlide() {
    cancelAnimationFrame(frame);
    if (!gliding) return;
    gliding = false;
    viewport.classList.remove('is-gliding');
    var nearest = Math.round(viewport.scrollLeft / viewport.clientWidth);
    if (nearest >= slides.length) viewport.scrollTo({left:0, behavior:'instant'});
    update(nearest, false);
  }
  function settle(index, automatic) {
    var actual = index >= slides.length ? 0 : index;
    viewport.scrollTo({left:actual * viewport.clientWidth, behavior:'instant'});
    gliding = false;
    viewport.classList.remove('is-gliding');
    update(actual, automatic);
    schedule();
  }
  function go(index, automatic, instant) {
    stopTimer();
    stopGlide();
    index = Math.max(0, Math.min(automatic ? slides.length : slides.length - 1, index));
    var from = viewport.scrollLeft;
    var target = index * viewport.clientWidth;
    if (instant || motion.matches || Math.abs(target - from) < 1) { settle(index, automatic); return; }
    gliding = true;
    viewport.classList.add('is-gliding');
    var started = null;
    function animate(now) {
      if (started === null) started = now;
      var t = Math.min(1, (now - started) / 1100);
      var eased = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
      viewport.scrollTo({left:from + (target - from) * eased, behavior:'instant'});
      if (t < 1) frame = requestAnimationFrame(animate);
      else settle(index, automatic);
    }
    frame = requestAnimationFrame(animate);
  }
  choices.forEach(function (button, index) { button.addEventListener('click', function () { go(index, false); }); });
  prev.addEventListener('click', function () { go(current - 1, false); });
  next.addEventListener('click', function () { go(current + 1, false); });
  toggle.addEventListener('click', function () {
    paused = !paused;
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Start automatic class sliding' : 'Pause automatic class sliding');
    if (paused) stopGlide();
    schedule();
  });
  viewport.addEventListener('keydown', function (event) {
    if (event.target !== viewport) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      go(current + (event.key === 'ArrowRight' ? 1 : -1), false);
    }
  });
  viewport.addEventListener('scroll', function () {
    if (gliding) return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      var nearest = Math.round(viewport.scrollLeft / viewport.clientWidth);
      if (nearest >= slides.length) viewport.scrollTo({left:0, behavior:'instant'});
      update(nearest, false);
      schedule();
    }, 150);
  }, { passive: true });
  viewport.addEventListener('pointerdown', function () { dragging = true; stopTimer(); stopGlide(); });
  window.addEventListener('pointerup', function () { dragging = false; schedule(); });
  viewport.addEventListener('pointercancel', function () { dragging = false; schedule(); });
  carousel.addEventListener('mouseenter', function () { hovering = true; stopTimer(); });
  carousel.addEventListener('mouseleave', function () { hovering = false; schedule(); });
  carousel.addEventListener('focusin', function () { focused = true; stopTimer(); stopGlide(); });
  carousel.addEventListener('focusout', function (event) { focused = carousel.contains(event.relatedTarget); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('resize', function () { go(current, false, true); });
  motion.addEventListener('change', function () { toggle.hidden = motion.matches; if (motion.matches) stopGlide(); schedule(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; schedule(); }, {threshold:0.15}).observe(viewport);
  } else visible = true;
  toggle.hidden = motion.matches;
  update(0, false);
  schedule();
}());
